import { GraphQLSchema, GraphQLObjectType } from 'graphql/type';
import { LevelUp } from 'levelup';
import { ObjectSchema } from './schema/types';
import { parseInternalTypes } from './schema/parse';
import { schemaForObject } from './schema/object';

export const makeExecutableSchema = (sdl: string, store: LevelUp) => {
  const internalTypes = parseInternalTypes(sdl);

  const protoSchema = internalTypes.reduce(
    (acc, obj) => {
      const objSchema = schemaForObject({ obj, store });
      Object.assign(acc.query, objSchema.query);
      return acc;
    },
    { query: {} } as ObjectSchema
  );

  const query = new GraphQLObjectType({
    name: 'Query',
    fields: protoSchema.query,
  });

  return new GraphQLSchema({ query });
};
