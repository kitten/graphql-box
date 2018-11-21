import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { genObjectNames } from './names';
import * as gen from './gen';

export const schemaForObject = (obj: IGQLType) => {
  const names = genObjectNames(obj);
  const fieldMap = gen.genFieldMap(obj);
  const objectType = gen.genObjectType(names, obj, fieldMap);
  const uniqueWhereInput = gen.genUniqueWhereInput(names, obj);
};
