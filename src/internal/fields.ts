import { ObjectLike, ObjectFieldDefinition } from '../relational/types';

export const sanitiseFields = <T extends ObjectLike, K extends keyof T>(
  fields: ObjectFieldDefinition<K>[]
) => {
  const sparseFields: ObjectFieldDefinition<K>[] = fields.filter(({ name }) => {
    return name !== 'id' && name !== 'createdAt' && name !== 'updatedAt';
  });

  const withSystemFields = [
    // id is marked as non-unique here, however, that's simply to prevent
    // it from being indexed unnecessarily
    { name: 'id', type: 'ID', isList: false, isRequired: true, isUnique: false, isReadOnly: true },
    {
      name: 'createdAt',
      type: 'DateTime',
      isList: false,
      isRequired: true,
      isUnique: false,
      isReadOnly: true,
    },
    {
      name: 'updatedAt',
      type: 'DateTime',
      isList: false,
      isRequired: true,
      isUnique: false,
      isReadOnly: false,
    },
    ...sparseFields,
  ].sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });

  return withSystemFields as ObjectFieldDefinition<K>[];
};
