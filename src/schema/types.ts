import { GraphQLFieldConfigMap } from 'graphql/type';
import { FieldDefinition } from '../internal';
import { LevelInterface } from '../level';

export interface SchemaParams {
  name: string;
  fields: FieldDefinition[];
  store: LevelInterface;
}

export interface ObjectSchema {
  query: GraphQLFieldConfigMap<any, any>;
  mutation: GraphQLFieldConfigMap<any, any>;
}
