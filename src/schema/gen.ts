import { specifiedScalarTypes } from 'graphql/type/scalars';
import { GraphQLDateTime } from 'graphql-iso-date';
import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';

import {
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

import { ObjectNames } from './names';

const getScalarForString = (scalarType: string) => {
  const scalar = specifiedScalarTypes.find(x => x.name === scalarType);
  if (scalar === undefined) {
    throw new Error(`Unspecified scalar type "${scalarType}" found`);
  }

  return scalar;
};

const idScalar = new GraphQLNonNull(GraphQLID);
const timestampScalar = new GraphQLNonNull(GraphQLDateTime);

const genField = (name: string, type: GraphQLOutputType): GraphQLFieldConfig<any, any> => ({
  type,
});

const genInputField = (name: string, type: GraphQLInputType): GraphQLInputFieldConfig => ({
  type,
});

export const genFieldMap = (obj: IGQLType): GraphQLFieldConfigMap<any, any> => {
  const fieldMap: GraphQLFieldConfigMap<any, any> = {};

  for (const field of obj.fields) {
    const { name } = field;

    if (field.isId) {
      fieldMap.id = genField('id', idScalar);
    } else if (name === 'createdAt' || name === 'updatedAt') {
      fieldMap[name] = genField(name, timestampScalar);
    } else if (typeof field.type === 'string') {
      const scalar = getScalarForString(field.type);
      const maybeList = field.isList ? new GraphQLList(scalar) : scalar;
      const outputType = field.isRequired ? new GraphQLNonNull(maybeList) : maybeList;
      fieldMap[name] = genField(name, outputType);
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

export const genUniqueWhereInput = (names: ObjectNames, obj: IGQLType): GraphQLInputObjectType => {
  const inputName = `${names.typeName}WhereUnique`;
  const fieldMap: GraphQLInputFieldConfigMap = {
    id: genInputField('id', GraphQLID),
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
      fieldMap[name] = genInputField(name, scalar);
    }
  }

  return new GraphQLInputObjectType({
    name: inputName,
    fields: fieldMap,
  });
};
