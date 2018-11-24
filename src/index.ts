import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { AbstractLevelDOWN } from 'abstract-leveldown';

import { makeFields } from './internal';
import level from './level';
import { ObjectSchema } from './schema/types';
import { parseInternalTypes } from './schema/parse';
import { schemaForObject } from './schema/object';

const defaultProtoSchema = (): ObjectSchema => ({
  query: {},
  mutation: {},
});

export const makeExecutableSchema = (sdl: string, leveldown: AbstractLevelDOWN) => {
  const store = level(leveldown);
  const internalTypes = parseInternalTypes(sdl);

  const protoSchema = internalTypes.reduce((acc, obj) => {
    const name = obj.name;
    const fields = makeFields(obj);
    const { query, mutation } = schemaForObject({ name, fields, store });

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
