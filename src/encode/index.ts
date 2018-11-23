import {
  parseTime,
  serializeTime,
  parseDate,
  serializeDate,
} from 'graphql-iso-date/dist/utils/formatter';

import { ObjectFieldDefinition } from '../relational/types';

type Serializer<T> = (val: T) => string;
type Deserializer<T> = (str: string) => T;

const NOT_NULL_PREFIX = ':';
const NOT_NULL_CHARCODE = NOT_NULL_PREFIX.charCodeAt(0);

const LIST_SEPARATOR = ',';
const LIST_SEPARATOR_RE = /,/g;
const ESC_LIST_SEPARATOR = '%2C';
const ESC_LIST_SEPARATOR_RE = /%2C/g;

const identity = <T>(val) => val;

const serializeDateTime: Serializer<Date> = val => String(val.valueOf());
const deserializeDateTime: Deserializer<Date> = str => new Date(parseInt(str, 10));

const serializeBool: Serializer<boolean> = val => (val ? '1' : '0');
const deserializeBool: Deserializer<boolean> = str => str === '1';

const serializeFloat: Serializer<number> = val => String(val);
const deserializeFloat: Deserializer<number> = str => parseFloat(str);

const serializeInt: Serializer<number> = val => String(val | 0);
const deserializeInt: Deserializer<number> = str => parseInt(str, 10);

const serializeNull = <T>(child: Serializer<T>): Serializer<null | T> => val =>
  val === null ? '' : NOT_NULL_PREFIX + child(val);

const deserializeNull = <T>(child: Deserializer<T>): Deserializer<null | T> => str =>
  str.charCodeAt(0) !== NOT_NULL_CHARCODE ? null : child(str.slice(1));

const serializeListItem = (str: string): string =>
  str.replace(LIST_SEPARATOR_RE, ESC_LIST_SEPARATOR);
const deserializeListItem = (str: string): string =>
  str.replace(ESC_LIST_SEPARATOR_RE, ESC_LIST_SEPARATOR);

const serializeList = <T>(child: Serializer<T>): Serializer<T[]> => val => {
  let out = '';
  for (let i = 0, l = val.length; i < l; i++) {
    out += serializeListItem(child(val[i]));
    if (i < l - 1) {
      out += LIST_SEPARATOR;
    }
  }
  return out;
};

const deserializeList = <T>(child: Deserializer<T>): Deserializer<T[]> => str => {
  const raw = str.split(LIST_SEPARATOR);
  const out = new Array(raw.length);
  for (let i = 0, l = raw.length; i < l; i++) {
    out[i] = child(deserializeListItem(raw[i]));
  }
  return out;
};

export interface Encoder<T> {
  serializer: Serializer<T>;
  deserializer: Deserializer<T>;
}

export const makeEncoder = <T>(field: ObjectFieldDefinition<any>): Encoder<any> => {
  if (typeof field.type !== 'string') {
    throw new Error('Relationships in SDL types are currently unsupported');
  }

  const { type, isRequired, isList } = field;

  let serializer: Serializer<any>;
  let deserializer: Deserializer<any>;

  switch (type) {
    case 'Date':
      serializer = serializeDate;
      deserializer = parseDate;
      break;
    case 'Time':
      serializer = serializeTime;
      deserializer = parseTime;
      break;
    case 'DateTime':
      serializer = serializeDateTime;
      deserializer = deserializeDateTime;
      break;
    case 'Int':
      serializer = serializeInt;
      deserializer = deserializeInt;
      break;
    case 'Float':
      serializer = serializeFloat;
      deserializer = deserializeFloat;
      break;
    case 'Boolean':
      serializer = serializeBool;
      deserializer = deserializeBool;
      break;
    case 'ID':
    case 'String':
      serializer = identity;
      deserializer = identity;
      break;

    default:
      throw new Error(`Unspecified scalar type "${type}" found`);
  }

  if (isList) {
    serializer = serializeList(serializer);
    deserializer = deserializeList(deserializer);
  }

  if (!isRequired) {
    serializer = serializeNull(serializer);
    deserializer = deserializeNull(deserializer);
  }

  return { serializer, deserializer };
};
