const { ApolloServer } = require('apollo-server-micro');
const levelup = require('levelup');
const encode = require('encoding-down');
const memdown = require('memdown');

const { makeExecutableSchema } = require('../index');

const sdl = `
type Commit {
  id: ID! @unique
  hash: String! @unique
  message: String
}

type File {
  id: ID! @unique
  createdAt: DateTime!
  name: String
}
`;

const store = levelup(encode(memdown(), { keyEncoding: 'none', valueEncoding: 'json' }));
const schema = makeExecutableSchema(sdl, store);

const apolloServer = new ApolloServer({ schema, tracing: true });
module.exports = apolloServer.createHandler();
