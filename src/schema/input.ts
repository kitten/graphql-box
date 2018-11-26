import { GraphQLInputObjectType } from 'graphql/type';
import { ObjectDefinition } from '../internal';
import { genFieldConf } from './field';

export const genCreateInput = (obj: ObjectDefinition) => {
  const { typeName, fields } = obj;
  const inputName = `${typeName}Create`;
  const fieldMap = {};

  for (const field of fields) {
    if (!field.isSystemField) {
      fieldMap[field.name] = genFieldConf(field);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genUpdateInput = (obj: ObjectDefinition) => {
  const { typeName, fields } = obj;
  const inputName = `${typeName}Update`;
  const fieldMap = {};

  for (const field of fields) {
    if (!field.isReadOnly && !field.isSystemField) {
      fieldMap[field.name] = genFieldConf(field, false);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
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
