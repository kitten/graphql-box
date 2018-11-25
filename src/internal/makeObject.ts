import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { camelCase, capitalize, plural } from 'prisma-generate-schema/dist/src/util/util';
import { makeFields, FieldDefinition } from './makeFields';
import { RelationshipDefinition } from './makeRelationship';

export class ObjectDefinition<K = any> {
  typeName: string;
  singleName: string;
  multiName: string;
  fields: FieldDefinition<K>[];
  relations: RelationshipDefinition[];

  constructor(obj: IGQLType) {
    const { name, isEnum } = obj;
    if (isEnum) {
      return null;
    }

    this.typeName = capitalize(name);
    this.singleName = camelCase(name);
    this.multiName = plural(camelCase(name));
    this.fields = makeFields<K>(obj);
    this.relations = [];
  }
}

export const combineTypeNames = (a: ObjectDefinition, b: ObjectDefinition) => {
  const nameA = a.typeName;
  const nameB = b.typeName;
  const orderedName = nameA >= nameB ? nameA + nameB : nameB + nameA;
  return `${camelCase(orderedName)}Relation`;
};

export const makeObject = <K>(obj: IGQLType): ObjectDefinition | null => {
  return new ObjectDefinition(obj);
};
