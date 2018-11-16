import { LevelUp } from 'levelup';

export interface ObjectFieldDefinition<K> {
  name: K;
  defaultValue?: string | number | null;
  isUnique: boolean;
  isReadOnly: boolean;
}

export interface ObjectTableParams<K> {
  name: string;
  fields: ObjectFieldDefinition<any>[];
  store: LevelUp;
}

export interface ObjectFieldIndexParams<K> {
  typeName: string;
  fieldName: K;
  store: LevelUp;
}

export interface ObjectLike {
  id: string;
  createdAt: number;
  updatedAt: number;
}

export interface IteratorOptions {
  reverse?: boolean;
  limit?: number;
}

export type Entry<K, V> = [K, V];
