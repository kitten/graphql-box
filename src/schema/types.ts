import { GraphQLFieldConfigMap } from 'graphql/type';
import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { LevelUp } from 'levelup';

export interface SchemaParams {
  obj: IGQLType;
  store: LevelUp;
}

export interface ObjectSchema {
  query: GraphQLFieldConfigMap<any, any>;
  // mutation: GraphQLFieldConfigMap<any, any>;
}
