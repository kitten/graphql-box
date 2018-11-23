import { AbstractIterator } from 'abstract-leveldown';
import { LevelInterface } from '../level';
import { Encoder } from '../encode';
import ObjectFieldIndex from './ObjectFieldIndex';

export type Iterator = AbstractIterator<string, string>;

export interface ObjectFieldDefinition<K> {
  name: K;
  type: string;
  defaultValue?: any;
  isUnique: boolean;
  isReadOnly: boolean;
  isRequired: boolean;
  isList: boolean;
}

export interface ObjectTableParams<K> {
  name: string;
  fields: ObjectFieldDefinition<K>[];
  store: LevelInterface;
}

export interface ObjectFieldIndexParams<K> {
  typeName: string;
  fieldName: K;
  store: LevelInterface;
}

export interface ObjectLike {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IteratorOptions {
  reverse?: boolean;
  limit?: number;
}

export type FieldIndexMap<T extends ObjectLike> = { [K in keyof T]?: ObjectFieldIndex<K> };
export type EncoderMap<T extends ObjectLike> = { [K in keyof T]?: Encoder<T[K]> };
export type EncoderList<T> = Encoder<T[keyof T]>[];
