import { graphql, GraphQLSchema } from 'graphql';
import levelup, { LevelUp } from 'levelup';
import encode from 'encoding-down';
import memdown from 'memdown';

import { makeExecutableSchema } from '../index';

const sdl = `
  type Commit {
    id: ID! @unique
    hash: String! @unique
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

  describe('Basic CRUD', () => {
    it('supports creating items with complete data', async () => {
      expect(
        await graphql(
          schema,
          `
            mutation {
              createCommit(data: { hash: "dc6dff6", message: "Initial Commit" }) {
                id
                hash
                message
              }
            }
          `
        )
      ).toEqual({
        data: {
          createCommit: {
            id: expect.any(String),
            hash: 'dc6dff6',
            message: 'Initial Commit',
          },
        },
      });
    });

    it('supports creating items with required fields only', async () => {
      expect(
        await graphql(
          schema,
          `
            mutation {
              createCommit(data: { hash: "dc6dff6" }) {
                id
                hash
                message
              }
            }
          `
        )
      ).toEqual({
        data: {
          createCommit: {
            id: expect.any(String),
            hash: 'dc6dff6',
            message: null,
          },
        },
      });
    });

    it('supports creating items then retrieving them by id or indexed field', async () => {
      const {
        data: {
          createCommit: { id, hash },
        },
      } = await graphql(
        schema,
        `
          mutation {
            createCommit(data: { hash: "dc6dff6", message: "Initial Commit" }) {
              id
              hash
              message
            }
          }
        `
      );

      const expected = {
        data: {
          commit: {
            id,
            hash: 'dc6dff6',
            message: 'Initial Commit',
          },
        },
      };

      expect(
        await graphql(
          schema,
          `
        {
          commit(where: { id: "${id}" }) {
            id
            hash
            message
          }
        }
      `
        )
      ).toEqual(expected);

      expect(
        await graphql(
          schema,
          `
        {
          commit(where: { hash: "${hash}" }) {
            id
            hash
            message
          }
        }
      `
        )
      ).toEqual(expected);
    });
  });
});
