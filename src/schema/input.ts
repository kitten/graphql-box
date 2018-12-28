import { GraphQLInputObjectType } from 'graphql/type';
import { ObjectDefinition } from '../internal';
import { ResolverMap } from './ResolverMap';
import { genFieldConf } from './field';
import { list } from './scalar';

export const genCreateInput = (ctx: ResolverMap, obj: ObjectDefinition) => {
  const { typeName, fields, relations } = obj;
  const inputName = `${typeName}Create`;

  return new GraphQLInputObjectType({
    name: inputName,
    fields: () => {
      const fieldMap = {};

      for (const field of fields) {
        if (!field.isSystemField) {
          fieldMap[field.name] = genFieldConf(field);
        }
      }

      for (const relation of relations) {
        const selfField = relation.getSelfField(obj);
        const input = ctx.getConnectionInput(selfField.relatedDefinition.typeName);

        fieldMap[selfField.fieldName] = {
          type: selfField.isList ? list(input) : input,
        };
      }

      return fieldMap;
    },
  });
};

export const genUpdateInput = (ctx: ResolverMap, obj: ObjectDefinition) => {
  const { typeName, fields, relations } = obj;
  const inputName = `${typeName}Update`;

  return new GraphQLInputObjectType({
    name: inputName,
    fields: () => {
      const fieldMap = {};

      for (const field of fields) {
        if (!field.isReadOnly && !field.isSystemField) {
          fieldMap[field.name] = genFieldConf(field, false);
        }
      }

      for (const relation of relations) {
        const selfField = relation.getSelfField(obj);
        const input = ctx.getConnectionInput(selfField.relatedDefinition.typeName);

        fieldMap[selfField.fieldName] = {
          type: selfField.isList ? list(input) : input,
        };
      }

      return fieldMap;
    },
  });
};

export const genUniqueWhereInput = (obj: ObjectDefinition) => {
  const { typeName, fields } = obj;
  const inputName = `${typeName}WhereUnique`;
  const fieldMap = {};

  for (const field of fields) {
    if (field.name === 'id' || field.isUnique) {
      fieldMap[field.name] = genFieldConf(field, false);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genConnectionInput = (
  obj: ObjectDefinition,
  whereInput: GraphQLInputObjectType,
  createInput: GraphQLInputObjectType
) => {
  const { typeName } = obj;

  return new GraphQLInputObjectType({
    name: `${typeName}Connection`,
    fields: {
      where: { type: whereInput },
      create: { type: createInput },
    },
  });
};
