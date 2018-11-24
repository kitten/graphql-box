import RelationalParser from 'prisma-generate-schema/dist/src/datamodel/relationalParser';
import { makeObject } from './makeObject';

export { makeFields, FieldDefinition } from './makeFields';
export { makeObject, ObjectDefinition } from './makeObject';
export { Serializer, Deserializer } from './types';

export const parseSDL = (sdl: string) => {
  const internalTypes = new RelationalParser().parseFromSchemaString(sdl);

  return internalTypes.map(obj => makeObject(obj)).filter(obj => obj !== null);
};
