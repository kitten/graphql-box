import { AbstractIterator } from 'abstract-leveldown';
import { FieldDefinition, Serializer } from '../internal';
import { LevelInterface } from '../level';
import ObjectFieldIndex from './ObjectFieldIndex';
import ObjectFieldOrdinal from './ObjectFieldOrdinal';

export type Iterator = AbstractIterator<string, string>;

export interface ObjectFieldIndexParams<K> {
  typeName: string;
  fieldName: K;
  store: LevelInterface;
}

export interface EdgeRelationshipParams<K> {
  relationName: null | string;
  typeNames: [string, string];
  store: LevelInterface;
}

export interface ObjectLike {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ObjectTableParams<T extends ObjectLike, K extends keyof T = keyof T> {
  name: string;
  fields: FieldDefinition<T[K], K>[];
  store: LevelInterface;
}

export interface IteratorOptions {
  reverse?: boolean;
  limit?: number;
}

export type FieldEncoderMap<T extends ObjectLike> = { [K in keyof T]?: Serializer<T[K]> };
export type FieldIndexMap<T extends ObjectLike> = { [K in keyof T]?: ObjectFieldIndex<K> };
export type FieldOrdinalMap<T extends ObjectLike> = { [K in keyof T]?: ObjectFieldOrdinal<K> };
