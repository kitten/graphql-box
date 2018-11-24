import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { AbstractLevelDOWN } from 'abstract-leveldown';

import level from './level';
import { parseSDL } from './internal';
import { schemaForObject, ObjectSchema } from './schema';

const defaultProtoSchema = (): ObjectSchema => ({
  query: {},
  mutation: {},
});

export const makeExecutableSchema = (sdl: string, leveldown: AbstractLevelDOWN) => {
  const store = level(leveldown);
  const objects = parseSDL(sdl);

  const protoSchema = objects.reduce((acc, obj) => {
    const { query, mutation } = schemaForObject(obj, store);
    Object.assign(acc.query, query);
    Object.assign(acc.mutation, mutation);
    return acc;
  }, defaultProtoSchema());

  return new GraphQLSchema({
    query: new GraphQLObjectType({
      name: 'Query',
      fields: protoSchema.query,
    }),
    mutation: new GraphQLObjectType({
      name: 'Mutation',
      fields: protoSchema.mutation,
    }),
  });
};
