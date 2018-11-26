import { GraphQLObjectType } from 'graphql/type';
import { ObjectDefinition } from '../internal';
import { ResolverMap } from './ResolverMap';
import { nonNull } from './scalar';
import { genFieldConf } from './field';
import { genCreateInput, genUpdateInput, genUniqueWhereInput } from './input';
import { genRelationshipFieldConfig } from './relationship';

const genObjectType = (ctx: ResolverMap, obj: ObjectDefinition) => {
  const { typeName, fields, relations } = obj;

  return new GraphQLObjectType({
    name: typeName,
    fields: () => {
      const fieldMap = {};
      for (const field of fields) {
        const { name } = field;
        fieldMap[name] = genFieldConf(field);
      }

      for (const relation of relations) {
        const { fromFieldName } = relation;
        const fieldConf = genRelationshipFieldConfig(ctx, obj, relation);
        fieldMap[fromFieldName] = fieldConf;
      }

      return fieldMap;
    },
  });
};

export const addObjectResolvers = (ctx: ResolverMap, obj: ObjectDefinition) => {
  const { typeName, singleName } = obj;
  const table = ctx.getTable(obj.typeName);

  const getResolver = (_, { where }) => table.findObjectByIndex(where);
  const createResolver = (_, { data }) => table.createObject(data);
  const updateResolver = (_, { where, data }) => table.updateObject(where, data);
  const deleteResolver = (_, { where }) => table.deleteObject(where);

  const objType = genObjectType(ctx, obj);
  const createInput = genCreateInput(obj);
  const updateInput = genUpdateInput(obj);
  const uniqueWhereInput = genUniqueWhereInput(obj);

  ctx.addObjectType(typeName, objType);

  ctx.addField('Query', singleName, {
    type: objType,
    args: {
      where: { type: nonNull(uniqueWhereInput) },
    },
    resolve: getResolver,
  });

  ctx.addField('Mutation', `create${typeName}`, {
    type: objType,
    args: {
      data: { type: nonNull(createInput) },
    },
    resolve: createResolver,
  });

  ctx.addField('Mutation', `update${typeName}`, {
    type: objType,
    args: {
      where: { type: nonNull(uniqueWhereInput) },
      data: { type: nonNull(updateInput) },
    },
    resolve: updateResolver,
  });

  ctx.addField('Mutation', `delete${typeName}`, {
    type: objType,
    args: {
      where: { type: nonNull(uniqueWhereInput) },
    },
    resolve: deleteResolver,
  });
};
