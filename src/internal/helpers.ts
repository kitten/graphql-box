import { FieldDefinition } from './types';

export const isSystemField = (name: string) =>
  name === 'id' || name === 'createdAt' || name === 'updatedAt';

export const systemFields: FieldDefinition[] = [
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
