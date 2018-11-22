import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { LevelUp } from 'levelup';
import { ObjectSchema } from './schema/types';
import { parseInternalTypes } from './schema/parse';
import { schemaForObject } from './schema/object';

const defaultProtoSchema = (): ObjectSchema => ({
  query: {},
  mutation: {},
});

export const makeExecutableSchema = (sdl: string, store: LevelUp) => {
  const internalTypes = parseInternalTypes(sdl);

  const protoSchema = internalTypes.reduce((acc, obj) => {
    const objSchema = schemaForObject({ obj, store });
    Object.assign(acc.query, objSchema.query);
    Object.assign(acc.mutation, objSchema.mutation);
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
