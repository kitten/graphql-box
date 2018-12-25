# graphql-box

Instant GraphQL [OpenCRUD](https://www.opencrud.org/#sec-undefined.Overview) executable schemas.<br />
Universally deployable (It's just JS™) and compatible with any [leveldown store](https://github.com/Level/awesome#stores)!

## What is it?

`graphql-box` is a **GraphQL schema generator**. It accepts a [GraphQL SDL](https://graphql.org/learn/schema/)
string and outputs an [OpenCRUD](https://www.opencrud.org/#sec-undefined.Overview) schema.
This schema exposes CRUD queries and mutations, making it essentially a **GraphQL-based ORM**.

It can use any leveldown store as its storage engine, which in turns supports databases like **IndexedDB**,
**LevelDB**, **Redis**, **Mongo**, and [more](https://github.com/Level/awesome#stores).

## Why does it exist?

GraphQL exists as a language and protocol facilitating a framework around specifying relational data
and querying it. It speeds up the development of web apps by simplifying how to inject and fetch data.

On the server-side tools like [Prisma](https://www.prisma.io/) help to speed up the other side of
the GraphQL ecosystem. The development of GraphQL APIs can be sped a lot by writing data models in SDL
and automating details of the data's storage away.

`graphql-box` aims to make the latter as simple as possible, allowing you to quickly create ORM-like schemas
instantly **in Node.js** on a multitude of storage engines, or also **just in the browser**.
