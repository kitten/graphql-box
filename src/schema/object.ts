import { ObjectDefinition } from '../internal';
import { LevelInterface } from '../level';
import { ObjectTable } from '../relational';
import { ObjectSchema } from './types';
import * as gen from './gen';

export const schemaForObject = (obj: ObjectDefinition, store: LevelInterface): ObjectSchema => {
  const { typeName, fields } = obj;
  const objectType = gen.genObjectType(typeName, fields);
  const createInput = gen.genCreateInput(typeName, fields);
  const updateInput = gen.genUpdateInput(typeName, fields);
  const uniqueWhereInput = gen.genUniqueWhereInput(typeName, fields);

  const table = new ObjectTable({
    name: typeName,
    fields,
    store,
  });

  return {
    query: {
      [obj.singleName]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
        },
        resolve: async (_, { where }) => table.findObjectByIndex(where),
      },
    },
    mutation: {
      [`create${typeName}`]: {
        type: objectType,
        args: { data: { type: gen.nonNull(createInput) } },
        resolve: (_, { data }) => table.createObject(data),
      },
      [`update${typeName}`]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
          data: { type: gen.nonNull(updateInput) },
        },
        resolve: (_, { where, data }) => table.updateObject(where, data),
      },
      [`delete${typeName}`]: {
        type: objectType,
        args: {
          where: { type: gen.nonNull(uniqueWhereInput) },
        },
        resolve: (_, { where, data }) => table.deleteObject(where),
      },
    },
  };
};
