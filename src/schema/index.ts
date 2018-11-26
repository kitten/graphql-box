import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { LevelInterface } from '../level';
import { SchemaDefinition } from '../internal';
import { ResolverMap } from './ResolverMap';
import { addObjectResolvers } from './object';

export const genSchema = (store: LevelInterface, definition: SchemaDefinition) => {
  const ctx = new ResolverMap(store, definition);

  for (const obj of definition.objects) {
    addObjectResolvers(ctx, obj);
  }

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: ctx.resolvers.Query,
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: ctx.resolvers.Mutation,
    }),
  });
};
