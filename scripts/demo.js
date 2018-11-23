const { ApolloServer } = require('apollo-server-micro');
const memdown = require('memdown');

const { makeExecutableSchema } = require('../index');

const sdl = `
type Commit {
  id: ID! @unique
  hash: String! @unique
  message: String
  meta: JSON!
}

type File {
  id: ID! @unique
  createdAt: DateTime!
  name: String!
}
`;

const schema = makeExecutableSchema(sdl, memdown());

const apolloServer = new ApolloServer({ schema, tracing: true });
module.exports = apolloServer.createHandler();
