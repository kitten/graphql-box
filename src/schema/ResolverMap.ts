import { GraphQLObjectType, GraphQLInputObjectType } from 'graphql/type';
import { LevelInterface } from '../level';
import { ObjectTable } from '../relational';
import { SchemaDefinition } from '../internal';
import {
  FieldResolverMap,
  ResolverTypeName,
  InputObjectTypeMap,
  ObjectTypeMap,
  FieldConfig,
} from './types';

export class ResolverMap {
  store: LevelInterface;
  schema: SchemaDefinition;
  tableByName: Record<string, ObjectTable<any, any>>;

  objectTypes: ObjectTypeMap = {};
  connectionInputs: InputObjectTypeMap = {};
  resolvers: FieldResolverMap = {
    Query: {},
    Mutation: {},
  };

  constructor(store: LevelInterface, schema: SchemaDefinition) {
    this.store = store;
    this.schema = schema;

    this.tableByName = schema.objects.reduce((acc, obj) => {
      acc[obj.typeName] = new ObjectTable({
        name: obj.typeName,
        fields: obj.fields,
        store,
      });

      return acc;
    }, {});
  }

  getTable(typeName: string) {
    return this.tableByName[typeName];
  }

  addField(typeName: ResolverTypeName, fieldName: string, conf: FieldConfig) {
    if (this.resolvers[typeName] === undefined) {
      this.resolvers[typeName] = {};
    }

    this.resolvers[typeName][fieldName] = conf;
  }

  addObjectType(typeName: string, objType: GraphQLObjectType) {
    this.objectTypes[typeName] = objType;
  }

  getObjectType(typeName: string) {
    return this.objectTypes[typeName];
  }

  addConnectionInput(typeName: string, inputType: GraphQLInputObjectType) {
    this.connectionInputs[typeName] = inputType;
  }

  getConnectionInput(typeName: string) {
    return this.connectionInputs[typeName];
  }
}
