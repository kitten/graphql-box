import RelationalParser from 'prisma-generate-schema/dist/src/datamodel/relationalParser';
import { capitalize } from 'prisma-generate-schema/dist/src/util/util';
import { makeObject, combineTypeNames, ObjectDefinition } from './makeObject';
import { makeRelationship, RelationshipDefinition } from './makeRelationship';

export interface SchemaDefinition {
  objects: ObjectDefinition[];
  objByName: Record<string, ObjectDefinition>;
  relationsByName: Record<string, RelationshipDefinition>;
}

export const makeSchemaDefinition = (sdl: string): SchemaDefinition => {
  const internalTypes = new RelationalParser().parseFromSchemaString(sdl);
  const objects = internalTypes.map(obj => makeObject(obj)).filter(obj => obj !== null);

  const objByName: Record<string, ObjectDefinition> = objects.reduce((acc, obj) => {
    acc[obj.typeName] = obj;
    return acc;
  }, {});

  const relationsByName: Record<string, RelationshipDefinition> = {};

  // Find all unique relations and create them
  for (const obj of internalTypes) {
    const fromObj = objByName[capitalize(obj.name)];
    if (fromObj !== undefined) {
      for (const field of obj.fields) {
        if (typeof field.type !== 'string') {
          const toObj = objByName[capitalize(field.type.name)];
          if (toObj !== undefined) {
            // Skip if this relation has been created already
            const relationName = field.relationName || combineTypeNames(fromObj, toObj);
            if (relationsByName[relationName] === undefined) {
              // This will create the relation and return it but it'll also write it to fromObj/toObj and
              // add appropriate fields to the ObjectDefinitions if needed
              relationsByName[relationName] = makeRelationship(
                [fromObj, toObj],
                [field, field.relatedField]
              );
            }
          }
        }
      }
    }
  }

  return {
    objects,
    objByName,
    relationsByName,
  };
};
