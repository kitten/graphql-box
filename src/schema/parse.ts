import { GraphQLSchema } from 'graphql/type';
import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import RelationalParser from 'prisma-generate-schema/dist/src/datamodel/relationalParser';
import RelationalGenerator from 'prisma-generate-schema/dist/src/generator/default';

export const parseInternalTypes = (schema: string): IGQLType[] => {
  return new RelationalParser().parseFromSchemaString(schema);
};

export const generateSchema = (types: IGQLType[]): GraphQLSchema => {
  return new RelationalGenerator().schema.generate(types, {});
};
