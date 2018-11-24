import { GraphQLFieldConfigMap } from 'graphql/type';

export interface ObjectSchema {
  query: GraphQLFieldConfigMap<any, any>;
  mutation: GraphQLFieldConfigMap<any, any>;
}
