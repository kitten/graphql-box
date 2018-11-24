export type Scalar =
  | 'Date'
  | 'Time'
  | 'DateTime'
  | 'JSON'
  | 'Int'
  | 'Float'
  | 'Boolean'
  | 'ID'
  | 'String';

export interface FieldDefinition<K = any> {
  name: K;
  type: Scalar;
  defaultValue?: any;
  isSystemField: boolean; // One of: 'id', 'createdAt', or 'updatedAt'
  isList: boolean; // Scalar is a list
  isRequired: boolean; // Scalar is non-nullable
  isUnique: boolean; // Column should be uniquely indexed
  isOrdinal: boolean; // Column should be non-uniquely indexed
  isReadOnly: boolean; // Column cannot be modified after creation
}
