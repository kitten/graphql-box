import ObjectTable from '../level/ObjectTable';
import { genObjectNames } from './names';
import { SchemaParams, ObjectSchema } from './types';
import * as gen from './gen';

export const schemaForObject = ({ obj, store }: SchemaParams): ObjectSchema => {
  const names = genObjectNames(obj);
  const fieldMap = gen.genFieldMap(obj);
  const objectType = gen.genObjectType(names, obj, fieldMap);
  const createInput = gen.genCreateInput(names, obj);
  const updateInput = gen.genUpdateInput(names, obj);
  const uniqueWhereInput = gen.genUniqueWhereInput(names, obj);

  const table = new ObjectTable({
    name: names.typeName,
    fields: obj.fields,
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
