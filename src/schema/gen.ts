import {
  getNullableType,
  GraphQLInputFieldConfigMap,
  GraphQLFieldConfigMap,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInputObjectType,
} from 'graphql/type';

import { FieldDefinition } from '../internal';
import { getScalarForString } from './scalars';
import { ObjectNames } from './names';

export const nonNull = x => new GraphQLNonNull(getNullableType(x));
export const list = x => new GraphQLList(nonNull(x));

const genField = (field: FieldDefinition, withRequired = true) => {
  const type = getScalarForString(field.type);
  const maybeList = field.isList ? list(type) : type;
  const maybeRequired = field.isRequired && withRequired ? nonNull(maybeList) : maybeList;
  return { type: maybeRequired };
};

export const genObjectType = (names: ObjectNames, fields: FieldDefinition[]) => {
  const fieldMap: GraphQLFieldConfigMap<any, any> = {};
  for (const field of fields) {
    fieldMap[field.name] = genField(field);
  }

  return new GraphQLObjectType({
    name: names.typeName,
    fields: fieldMap,
  });
};

export const genCreateInput = (names: ObjectNames, fields: FieldDefinition[]) => {
  const inputName = `${names.typeName}Create`;
  const fieldMap: GraphQLInputFieldConfigMap = {};

  for (const field of fields) {
    if (!field.isSystemField) {
      fieldMap[field.name] = genField(field);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genUpdateInput = (names: ObjectNames, fields: FieldDefinition[]) => {
  const inputName = `${names.typeName}Update`;
  const fieldMap: GraphQLInputFieldConfigMap = {};

  for (const field of fields) {
    if (!field.isReadOnly && !field.isSystemField) {
      fieldMap[field.name] = genField(field, false);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genUniqueWhereInput = (names: ObjectNames, fields: FieldDefinition[]) => {
  const inputName = `${names.typeName}WhereUnique`;
  const fieldMap: GraphQLInputFieldConfigMap = {};

  for (const field of fields) {
    if (field.name === 'id' || field.isUnique) {
      fieldMap[field.name] = genField(field, false);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};
