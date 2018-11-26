import { GraphQLObjectType } from 'graphql/type';
import {
  ObjectDefinition,
  RelationshipDefinition,
  RelationshipKind,
  RelationFieldParams,
} from '../internal';
import { ObjectTable } from '../relational';
import { ResolverMap } from './ResolverMap';
import { nonNull, list } from './scalar';
import { FieldResolver, FieldConfig } from './types';

type Table = ObjectTable<any, any>;

const makeIdResolver = (table: Table, fieldName: string) => {
  return async parent => {
    const toId = parent[fieldName];
    return toId === null ? null : await table.getObject(toId);
  };
};

const makeForeignKeyResolver = (table: Table, fieldName: string) => {
  return async parent => {
    const parentId = parent.id;
    return await table.findObjectsByOrdinal(fieldName, parentId);
  };
};

const genRelationFieldType = (relatedObjType: GraphQLObjectType, field: RelationFieldParams) => {
  let scalar = field.isList ? list(relatedObjType) : relatedObjType;
  scalar = field.isRequired ? nonNull(scalar) : scalar;
  return scalar;
};

export const genRelationshipFieldConfig = (
  ctx: ResolverMap,
  obj: ObjectDefinition,
  relation: RelationshipDefinition
): FieldConfig => {
  const { kind } = relation;
  const field = relation.getSelfField(obj);
  const { relatedDefinition, fieldName, relatedFieldName, isList } = field;
  const relatedTable = ctx.getTable(relatedDefinition.typeName);
  const relatedObjType = ctx.getObjectType(relatedDefinition.typeName);

  let resolve: FieldResolver;

  if (kind === RelationshipKind.ToOne || kind === RelationshipKind.OneToOne) {
    resolve = makeIdResolver(relatedTable, fieldName);
  } else if (kind === RelationshipKind.OneToMany && !isList) {
    resolve = makeForeignKeyResolver(relatedTable, relatedFieldName);
  } else if (kind === RelationshipKind.OneToMany && isList) {
    resolve = makeIdResolver(relatedTable, fieldName);
  } else if (kind === RelationshipKind.ManyToMany) {
    throw new Error('ManyToMany relationships are not implemented yet'); // TODO
  }

  const type = genRelationFieldType(relatedObjType, field);
  return { type, resolve };
};
