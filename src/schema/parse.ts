import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import RelationalParser from 'prisma-generate-schema/dist/src/datamodel/relationalParser';

export const parseInternalTypes = (schema: string): IGQLType[] => {
  return new RelationalParser().parseFromSchemaString(schema);
};
