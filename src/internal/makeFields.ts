import { IGQLType } from 'prisma-generate-schema/dist/src/datamodel/model';
import { Scalar, FieldDefinition } from './types';
import { isSystemField, systemFields } from './helpers';

// Validate input scalars
const toScalar = (type: string | IGQLType): Scalar => {
  if (typeof type !== 'string') {
    // TODO
    throw new Error('Relationship types are unsupported.');
  }

  switch (type) {
    case 'Date':
    case 'Time':
    case 'DateTime':
    case 'JSON':
    case 'Int':
    case 'Float':
    case 'Boolean':
    case 'ID':
    case 'String':
      return type as Scalar;
    default:
      throw new Error(`Unrecognised scalar of type "${type}".`);
  }
};

export const makeFields = <K>(obj: IGQLType): FieldDefinition<K>[] => {
  const sparseFields = obj.fields.filter(field => !isSystemField(field.name) && !field.isId);

  // Convert IGQLField to FieldDefinitions
  const objFieldDefinitions = sparseFields.map(field => {
    const def = {
      name: field.name,
      type: toScalar(field.type),
      defaultValue: field.defaultValue,
      isSystemField: false,
      isList: field.isList,
      isRequired: field.isRequired,
      isUnique: field.isUnique,
      isOrdinal: false,
      isReadOnly: field.isReadOnly,
    };

    // Constraints of field types and indexing
    if (def.isUnique && def.isOrdinal) {
      throw new Error(`Field "${def.name}" has been marked as both ordinal and unique.`);
    } else if ((def.isUnique || def.isOrdinal) && def.isList) {
      throw new Error(`Field "${def.name}" of type List cannot been marked as ordinal or unique.`);
    }

    return def;
  });

  // Add system fields which were previously filtered
  const fieldDefinitions = [...systemFields, ...objFieldDefinitions];

  // Sort by name to match the order that fields will be stored in Level
  return fieldDefinitions.sort((a, b) => {
    if (a.name < b.name) {
      return -1;
    } else if (a.name > b.name) {
      return 1;
    } else {
      return 0;
    }
  });
};
