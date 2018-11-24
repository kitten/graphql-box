export type Scalar =
  | 'Date'
  | 'Time'
  | 'DateTime'
  | 'JSON'
  | 'Int'
  | 'Float'
  | 'Boolean'
  | 'ID'
  | 'String';

export interface FieldDefinitionParams<K = any> {
  name: K;
  type: Scalar;
  defaultValue?: any;
  isSystemField: boolean;
  isList: boolean;
  isRequired: boolean;
  isUnique: boolean;
  isOrdinal: boolean;
  isReadOnly: boolean;
}

export type Serializer<T> = (val: T) => string;
export type Deserializer<T> = (str: string) => T;

export interface Encoder<T> {
  serializer: Serializer<T>;
  deserializer: Deserializer<T>;
}
