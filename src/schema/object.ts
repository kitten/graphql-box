import ObjectTable from '../level/ObjectTable';
import { genObjectNames } from './names';
import { SchemaParams, ObjectSchema } from './types';
import * as gen from './gen';

export const schemaForObject = ({ obj, store }: SchemaParams): ObjectSchema => {
  const names = genObjectNames(obj);
  const fieldMap = gen.genFieldMap(obj);
  const objectType = gen.genObjectType(names, obj, fieldMap);
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
        args: { input: { type: uniqueWhereInput } },
        resolve: async (_, { input }) => {
          const id = await table.getIdByIndex(input);
          if (id === null) {
            return null;
          }

          return await table.getObject(id);
        },
      },
    },
  };
};
