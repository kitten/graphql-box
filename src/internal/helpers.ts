import { IGQLType, IGQLField } from 'prisma-generate-schema/dist/src/datamodel/model';
import { Scalar, FieldDefinitionParams, RelationshipKind } from './types';

export const isRelationshipField = (type: string | IGQLType) => typeof type !== 'string';

export const isSystemField = (name: string) =>
  name === 'id' || name === 'createdAt' || name === 'updatedAt';

export const systemFieldDefs: FieldDefinitionParams[] = [
  {
    name: 'id',
    type: 'ID',
    isSystemField: true,
    isList: false,
    isRequired: true,
    // marked as non-unique since it shouldn't be indexed as it's already
    // the primary key
    isUnique: false,
    isOrdinal: false,
    isReadOnly: true,
  },
  {
    name: 'createdAt',
    type: 'DateTime',
    isSystemField: true,
    isList: false,
    isRequired: true,
    isUnique: false,
    isOrdinal: false,
    isReadOnly: true,
  },
  {
    name: 'updatedAt',
    type: 'DateTime',
    isSystemField: true,
    isList: false,
    isRequired: true,
    isUnique: false,
    isOrdinal: false,
    isReadOnly: false,
  },
];

// Validate input scalars
export const toScalar = (type: string): Scalar => {
  switch (type) {
    case 'Date':
    case 'Time':
    case 'DateTime':
    case 'JSON':
    case 'Int':
    case 'Float':
    case 'Boolean':
    case 'ID':
    case 'String':
      return type as Scalar;
    default:
      throw new Error(`Unrecognised scalar of type "${type}".`);
  }
};

export const getRelationshipKind = (field: IGQLField): RelationshipKind => {
  if (!field.isList && !field.relatedField) {
    return RelationshipKind.ToOne;
  } else if (!field.isList && field.relatedField && !field.relatedField.isList) {
    return RelationshipKind.OneToOne;
  } else if (field.isList && (!field.relatedField || !field.relatedField.isList)) {
    return RelationshipKind.OneToMany;
  } else if (!field.isList && field.relatedField && field.relatedField.isList) {
    return RelationshipKind.OneToMany;
  } else if (field.isList && field.relatedField && field.relatedField.isList) {
    return RelationshipKind.ManyToMany;
  } else {
    throw new Error(`Invalid relationship on "${field.name}"`);
  }
};
