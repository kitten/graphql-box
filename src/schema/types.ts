import {
  GraphQLFieldResolver,
  GraphQLFieldConfig,
  GraphQLInputObjectType,
  GraphQLObjectType,
} from 'graphql/type';

import { LevelInterface } from '../level';
import { ObjectDefinition } from '../internal';

export interface ContextParams {
  store: LevelInterface;
  objects: ObjectDefinition[];
}

export type FieldResolver<TParent = any> = GraphQLFieldResolver<TParent, any>;
export type FieldConfig<TParent = any> = GraphQLFieldConfig<TParent, any>;
export type ObjectResolverMap = Record<string, FieldConfig>;
export type ResolverTypeName = 'Query' | 'Mutation';
export type FieldResolverMap = Record<ResolverTypeName, ObjectResolverMap>;
export type ObjectTypeMap = Record<string, GraphQLObjectType>;
export type InputObjectTypeMap = Record<string, GraphQLInputObjectType>;
