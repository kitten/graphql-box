import { GraphQLFieldConfigMap } from 'graphql/type';
import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { LevelInterface } from '../level';

export interface SchemaParams {
  obj: IGQLType;
  store: LevelInterface;
}

export interface ObjectSchema {
  query: GraphQLFieldConfigMap<any, any>;
  mutation: GraphQLFieldConfigMap<any, any>;
}
