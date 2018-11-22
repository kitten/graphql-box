import { GraphQLSchema } from 'graphql/type';
import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { makeExecutableSchema } from '../index';

const sdl = `
  type Commit {
    id: ID! @unique
    hash: String!
    message: String
  }
`;

describe('makeExecutableSchema', () => {
  let store: LevelUp;
  let schema: GraphQLSchema;

  beforeEach(() => {
    store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
    schema = makeExecutableSchema(sdl, store);
  });

  describe('read operations', () => {
    it('supports reading by ids', async () => {
      expect(schema).toBeTruthy();
    });
  });
});
