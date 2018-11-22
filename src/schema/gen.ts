import { specifiedScalarTypes } from 'graphql/type/scalars';
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';
import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';

import {
  getNullableType,
  GraphQLInputFieldConfigMap,
  GraphQLInputFieldConfig,
  GraphQLFieldConfigMap,
  GraphQLInputType,
  GraphQLFieldConfig,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLID,
  GraphQLOutputType,
  GraphQLInputObjectType,
} from 'graphql/type';

import { getScalarForString } from './scalars';
import { ObjectNames } from './names';

const nonNull = x => new GraphQLNonNull(getNullableType(x));
const list = x => new GraphQLList(nonNull(x));
const idScalar = nonNull(GraphQLID);
const timestampScalar = nonNull(GraphQLDateTime);

interface FieldConfig {
  isRequired?: boolean;
  isList?: boolean;
}

const genField = (
  name: string,
  type: GraphQLOutputType,
  config: FieldConfig
): GraphQLFieldConfig<any, any> => {
  const maybeList = config.isList ? list(type) : type;
  const maybeRequired = config.isRequired ? nonNull(maybeList) : maybeList;
  return { type: maybeRequired };
};

const genInputField = (
  name: string,
  type: GraphQLInputType,
  config: FieldConfig
): GraphQLInputFieldConfig => {
  const maybeList = config.isList ? list(type) : type;
  const maybeRequired = config.isRequired ? nonNull(maybeList) : maybeList;
  return { type: maybeRequired };
};

export const genFieldMap = (obj: IGQLType): GraphQLFieldConfigMap<any, any> => {
  const fieldMap: GraphQLFieldConfigMap<any, any> = {};

  for (const field of obj.fields) {
    const { name, isList, isRequired } = field;

    if (field.isId) {
      fieldMap.id = genField('id', idScalar, { isRequired: true });
    } else if (name === 'createdAt' || name === 'updatedAt') {
      fieldMap[name] = genField(name, timestampScalar, { isRequired: true });
    } else if (typeof field.type === 'string') {
      const conf = { isList, isRequired };
      const scalar = getScalarForString(field.type);
      fieldMap[name] = genField(name, scalar, conf);
    } else {
      // TODO
      throw new Error('Relationships in SDL types are currently unsupported');
    }
  }
  return fieldMap;
};

export const genObjectType = (
  names: ObjectNames,
  obj: IGQLType,
  fieldMap: GraphQLFieldConfigMap<any, any>
): GraphQLObjectType => {
  if (obj.isEmbedded) {
    // TODO
    throw new Error('Embedded SDL types are currently unsupported');
  } else if (obj.isEnum) {
    // TODO
    throw new Error('SDL enums are currently unsupported');
  }

  return new GraphQLObjectType({
    name: names.typeName,
    fields: fieldMap,
  });
};

export const genCreateInput = (names: ObjectNames, obj: IGQLType): GraphQLInputObjectType => {
  const inputName = `${names.typeName}Create`;
  const fieldMap: GraphQLInputFieldConfigMap = {};

  for (const field of obj.fields) {
    const { name, isList, isRequired } = field;

    if (!field.isId && name !== 'createdAt' && name !== 'updatedAt') {
      if (typeof field.type === 'string') {
        const scalar = getScalarForString(field.type);
        fieldMap[name] = genInputField(name, scalar, { isList, isRequired });
      } else {
        // TODO
        throw new Error('Relationships in SDL types are currently unsupported');
      }
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genUpdateInput = (names: ObjectNames, obj: IGQLType): GraphQLInputObjectType => {
  const inputName = `${names.typeName}Update`;
  const fieldMap: GraphQLInputFieldConfigMap = {};

  for (const field of obj.fields) {
    const { name, isReadOnly, isList } = field;

    if (!isReadOnly) {
      if (typeof field.type === 'string') {
        const scalar = getScalarForString(field.type);
        fieldMap[name] = genInputField(name, scalar, { isList });
      } else {
        // TODO
        throw new Error('Relationships in SDL types are currently unsupported');
      }
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};

export const genUniqueWhereInput = (names: ObjectNames, obj: IGQLType): GraphQLInputObjectType => {
  const inputName = `${names.typeName}WhereUnique`;
  const fieldMap: GraphQLInputFieldConfigMap = {
    id: genInputField('id', GraphQLID, {}),
  };

  for (const field of obj.fields) {
    const { name } = field;

    if (!field.isId && field.isUnique) {
      if (field.isList) {
        throw new Error('A list field cannot be marked as unique');
      } else if (typeof field.type !== 'string') {
        throw new Error('Relationships in SDL input types are currently unsupported');
      }

      const scalar = getScalarForString(field.type);
      fieldMap[name] = genInputField(name, scalar, {});
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};
