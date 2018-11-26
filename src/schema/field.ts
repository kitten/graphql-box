import { FieldDefinition } from '../internal';
import { getScalarForString, list, nonNull } from './scalar';
import { FieldConfig } from './types';

const genFieldType = (field: FieldDefinition, withRequired) => {
  const fieldScalar = getScalarForString(field.type);
  let scalar = field.isList ? list(fieldScalar) : fieldScalar;
  scalar = field.isRequired && withRequired ? nonNull(scalar) : scalar;
  return scalar;
};

export const genFieldConf = (field: FieldDefinition, withRequired = true): FieldConfig => {
  return { type: genFieldType(field, withRequired) };
};
