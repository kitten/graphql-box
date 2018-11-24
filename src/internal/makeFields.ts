import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { Scalar, FieldDefinitionParams, Serializer, Deserializer } from './types';
import { isSystemField, systemFieldDefs, toScalar } from './helpers';
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
  const sparseFields = obj.fields.filter(field => !isSystemField(field.name) && !field.isId);

  // Convert IGQLField to FieldDefinitions
  const objFieldDefinitions = sparseFields.map(field => {
    const def = new FieldDefinition({
      name: field.name,
      type: toScalar(field.type),
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

  // Add system fields which were previously filtered
  const fieldDefinitions = [...systemFields, ...objFieldDefinitions];

  // Sort by name to match the order that fields will be stored in Level
  return fieldDefinitions.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });
};
