import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { AbstractLevelDOWN } from 'abstract-leveldown';
import levelup from 'levelup';
import encode from 'encoding-down';

import { ObjectSchema } from './schema/types';
import { parseInternalTypes } from './schema/parse';
import { schemaForObject } from './schema/object';

const defaultProtoSchema = (): ObjectSchema => ({
  query: {},
  mutation: {},
});

export const makeExecutableSchema = (sdl: string, leveldown: AbstractLevelDOWN) => {
  const store = levelup(encode(leveldown, { keyEncoding: 'none', valueEncoding: 'json' }));
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
