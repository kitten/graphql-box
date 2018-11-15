import { LevelUp } from 'levelup';

export interface ObjectFieldDefinition<K> {
  name: K;
  index: boolean;
  writeable: boolean;
}

export interface ObjectTableParams<K> {
  name: string;
  fields: ObjectFieldDefinition<K>[];
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
