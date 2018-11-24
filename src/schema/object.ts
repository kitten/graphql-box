import ObjectTable from '../relational/ObjectTable';
import { genObjectNames } from './names';
import { SchemaParams, ObjectSchema } from './types';
import * as gen from './gen';

export const schemaForObject = ({ name, fields, store }: SchemaParams): ObjectSchema => {
  const names = genObjectNames(name);
  const objectType = gen.genObjectType(names, fields);
  const createInput = gen.genCreateInput(names, fields);
  const updateInput = gen.genUpdateInput(names, fields);
  const uniqueWhereInput = gen.genUniqueWhereInput(names, fields);

  const table = new ObjectTable({
    name: names.typeName,
    fields,
    store,
  });

  return {
    query: {
      [names.singleName]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
        },
        resolve: async (_, { where }) => table.findObjectByIndex(where),
      },
    },
    mutation: {
      [`create${names.typeName}`]: {
        type: objectType,
        args: { data: { type: gen.nonNull(createInput) } },
        resolve: (_, { data }) => table.createObject(data),
      },
      [`update${names.typeName}`]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
          data: { type: gen.nonNull(updateInput) },
        },
        resolve: (_, { where, data }) => table.updateObject(where, data),
      },
      [`delete${names.typeName}`]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
        },
        resolve: (_, { where, data }) => table.deleteObject(where),
      },
    },
  };
};
