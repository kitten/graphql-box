import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { Scalar, FieldDefinitionParams } from './types';

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
export const toScalar = (type: string | IGQLType): Scalar => {
  if (typeof type !== 'string') {
    // TODO
    throw new Error('Relationship types are unsupported.');
  }

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
