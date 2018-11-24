import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { camelCase, capitalize, plural } from 'prisma-generate-schema/dist/src/util/util';
import { makeFields, FieldDefinition } from './makeFields';

export class ObjectDefinition<K = any> {
  typeName: string;
  singleName: string;
  multiName: string;
  fields: FieldDefinition<K>[];

  constructor(obj: IGQLType) {
    const { name, isEnum } = obj;
    if (isEnum) {
      return null;
    }

    this.typeName = capitalize(name);
    this.singleName = camelCase(name);
    this.multiName = plural(camelCase(name));
    this.fields = makeFields<K>(obj);
  }
}

export const makeObject = <K>(obj: IGQLType): ObjectDefinition | null => {
  return new ObjectDefinition(obj);
};
