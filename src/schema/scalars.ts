import {
  getNullableType,
  GraphQLID,
  GraphQLInt,
  GraphQLFloat,
  GraphQLString,
  GraphQLBoolean,
} from 'graphql/type';

import GraphQLJSON from 'graphql-type-json';
import { GraphQLDate, GraphQLTime, GraphQLDateTime } from 'graphql-iso-date';

const NullableDate = getNullableType(GraphQLDate);
const NullableTime = getNullableType(GraphQLTime);
const NullableDateTime = getNullableType(GraphQLDateTime);
const NullableID = getNullableType(GraphQLID);
const NullableJSON = getNullableType(GraphQLJSON);

export const getScalarForString = (scalarType: string) => {
  switch (scalarType) {
    case 'Date':
      return NullableDate;
    case 'Time':
      return NullableTime;
    case 'DateTime':
      return NullableDateTime;
    case 'JSON':
      return NullableJSON;
    case 'ID':
      return NullableID;
    case 'Int':
      return GraphQLInt;
    case 'Float':
      return GraphQLFloat;
    case 'String':
      return GraphQLString;
    case 'Boolean':
      return GraphQLBoolean;
    default:
      throw new Error(`Unspecified scalar type "${scalarType}" found`);
  }
};
