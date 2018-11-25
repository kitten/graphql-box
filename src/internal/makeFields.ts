import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { Scalar, FieldDefinitionParams, Serializer, Deserializer, RelationshipKind } from './types';
import {
  isRelationshipField,
  isSystemField,
  systemFieldDefs,
  toScalar,
  getRelationshipKind,
} from './helpers';
import { makeEncoder } from './encode';

export class FieldDefinition<T = any, K = any> {
  name: K;
  type: Scalar;
  defaultValue?: any;
  isSystemField: boolean; // One of: 'id', 'createdAt', or 'updatedAt'
  isList: boolean; // Scalar is a list
  isRequired: boolean; // Scalar is non-nullable
  isUnique: boolean; // Column should be uniquely indexed
  isOrdinal: boolean; // Column should be non-uniquely indexed
  isReadOnly: boolean; // Column cannot be modified after creation

  encode: Serializer<T>;
  decode: Deserializer<T>;

  constructor(params: FieldDefinitionParams<K>) {
    // Constraints of field types and indexing
    if (params.isUnique && params.isOrdinal) {
      throw new Error(`Field "${params.name}" has been marked as both ordinal and unique.`);
    } else if ((params.isUnique || params.isOrdinal) && params.isList) {
      throw new Error(
        `Field "${params.name}" of type List cannot been marked as ordinal or unique.`
      );
    }

    Object.assign(this, params);
    const encoder = makeEncoder(params);
    this.encode = encoder.serializer;
    this.decode = encoder.deserializer;
  }
}

const systemFields = systemFieldDefs.map(params => new FieldDefinition(params));

export const makeFields = <K>(obj: IGQLType): FieldDefinition<K>[] => {
  const sparseFields = obj.fields.filter(field => {
    return !isRelationshipField(field.type) && !isSystemField(field.name) && !field.isId;
  });

  // Convert IGQLField to FieldDefinitions
  const objFieldDefinitions = sparseFields.map(field => {
    const def = new FieldDefinition({
      name: field.name,
      type: toScalar(field.type as string),
      defaultValue: field.defaultValue,
      isSystemField: false,
      isList: field.isList,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isOrdinal: false,
      isReadOnly: field.isReadOnly,
    });

    return def;
  });

  const embeddedRelationshipFields = obj.fields.reduce((acc, field) => {
    if (typeof field === 'string') {
      return acc;
    }

    switch (getRelationshipKind(field)) {
      // On one-to-one we embed a relationshop field
      case RelationshipKind.OneToOne:
        acc.push({
          name: field.name,
          type: 'ID',
          isSystemField: false,
          isList: false,
          isRequired: field.isRequired,
          // When the one-to-one relationship is unidirectional
          // then this field becomes unique
          isUnique: !!field.relatedField,
          // Otherwise it stays a foreign key i.e. ordinal
          isOrdinal: !field.relatedField,
          isReadOnly: false,
        });

        break;

      // For one-to-many only the "one" side receives an embedded field
      case RelationshipKind.OneToMany:
        if (!field.isList) {
          acc.push({
            name: field.name,
            type: 'ID',
            isSystemField: false,
            isList: false,
            isRequired: field.isRequired,
            isUnique: false,
            isOrdinal: true,
            isReadOnly: false,
          });
        }

        break;

      default:
        break;
    }

    return acc;
  }, []);

  // Add system fields which were previously filtered
  return [...systemFields, ...objFieldDefinitions, ...embeddedRelationshipFields];
};
