import { IGQLField } from 'prisma-generate-schema/dist/src/datamodel/model';
import { ObjectDefinition } from './makeObject';
import { FieldDefinition } from './makeFields';
import { RelationshipKind } from './types';
import { getRelationshipKind } from './helpers';

type ObjectDefTuple = [ObjectDefinition, ObjectDefinition];
type FieldTuple = [IGQLField, null | IGQLField];

export class RelationshipDefinition {
  fromObj: ObjectDefinition;
  toObj: ObjectDefinition;
  fromField: IGQLField;
  toField: null | IGQLField;
  fromFieldName: string;
  toFieldName: null | string;
  kind: RelationshipKind;

  constructor(objTuple: ObjectDefTuple, fieldTuple: FieldTuple) {
    const fromObj = (this.fromObj = objTuple[0]);
    const toObj = (this.toObj = objTuple[1]);
    const fromField = (this.fromField = fieldTuple[0]);
    const toField = (this.toField = fieldTuple[1] || null);
    const kind = (this.kind = getRelationshipKind(this.fromField));
    const fromFieldName = (this.fromFieldName = fromField.name);

    const isFromRequired = fromField.isRequired;
    const isToRequired = toField !== null ? toField.isRequired : fromField.isRequired;

    // Add relationship to ObjectDefinitions
    fromObj.relations.push(this);
    toObj.relations.push(this);

    if (kind === RelationshipKind.ToOne) {
      this.toFieldName = null;

      fromObj.fields.push(
        new FieldDefinition({
          name: fromField.name,
          type: 'ID',
          isSystemField: false,
          isList: false,
          isRequired: isFromRequired,
          isUnique: false,
          isOrdinal: true,
          isReadOnly: false,
        })
      );
    } else if (kind === RelationshipKind.OneToOne) {
      if (isFromRequired !== isToRequired) {
        throw new Error(
          `Mismatching required type on related fields "${fromObj.typeName}:${
            fromField.name
          }" and "${toObj.typeName}:${toField.name}".`
        );
      }

      const fieldParams = {
        type: 'ID',
        isSystemField: false,
        isList: false,
        isRequired: isFromRequired,
        isUnique: true,
        isOrdinal: false,
        isReadOnly: false,
      };

      const toFieldName = (this.toFieldName = toField !== null ? toField.name : fromObj.singleName);

      fromObj.fields.push(
        new FieldDefinition({
          name: fromField.name,
          ...fieldParams,
        })
      );

      toObj.fields.push(
        new FieldDefinition({
          name: toFieldName,
          ...fieldParams,
        })
      );
    } else if (kind === RelationshipKind.OneToMany && fromField.isList) {
      const toFieldName = (this.toFieldName = toField !== null ? toField.name : fromObj.singleName);

      toObj.fields.push(
        new FieldDefinition({
          name: toFieldName,
          type: 'ID',
          isSystemField: false,
          isList: false,
          isRequired: isToRequired,
          isUnique: false,
          isOrdinal: true,
          isReadOnly: false,
        })
      );
    } else if (kind === RelationshipKind.OneToMany && !fromField.isList) {
      this.toFieldName = toField !== null ? toField.name : fromObj.multiName;

      fromObj.fields.push(
        new FieldDefinition({
          name: fromFieldName,
          type: 'ID',
          isSystemField: false,
          isList: false,
          isRequired: isFromRequired,
          isUnique: false,
          isOrdinal: true,
          isReadOnly: false,
        })
      );
    } else {
      // Many-to-many won't result in any fields being added
      this.toFieldName = toField !== null ? toField.name : fromObj.multiName;
    }
  }
}

export const makeRelationship = (objTuple: ObjectDefTuple, fieldTuple: FieldTuple) => {
  return new RelationshipDefinition(objTuple, fieldTuple);
};
