import { graphql, GraphQLSchema } from 'graphql';
import { AbstractLevelDOWN } from 'abstract-leveldown';
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
  let store: AbstractLevelDOWN;
  let schema: GraphQLSchema;

  beforeEach(() => {
    store = memdown();
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
                id, hash, message
              }
            }
          `
        )
      ).toEqual(expected);

      expect(
        await graphql(schema, `{ commit(where: { hash: "${hash}" }) { id, hash, message } }`)
      ).toEqual(expected);
    });

    it('supports creating items, updating, and retrieving them', async () => {
      const {
        data: { createCommit },
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

      const {
        data: { updateCommit },
      } = await graphql(
        schema,
        `
          mutation {
            updateCommit(where: { hash: "dc6dff6" }, data: { hash: "1111111" }) {
              id
              hash
              message
            }
          }
        `
      );

      expect(updateCommit.id).toBe(createCommit.id);
      expect(updateCommit.message).toBe(createCommit.message);

      const expected = {
        data: {
          commit: {
            id: createCommit.id,
            hash: updateCommit.hash,
            message: 'Initial Commit',
          },
        },
      };

      expect(
        await graphql(
          schema,
          `
            {
              commit(where: { hash: "1111111" }) {
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
