import { camelCase, capitalize, plural } from 'prisma-generate-schema/dist/src/util/util';

export interface ObjectNames {
  typeName: string;
  singleName: string;
  multiName: string;
}

export const genObjectNames = (name: string): ObjectNames => ({
  typeName: capitalize(name),
  singleName: camelCase(name),
  multiName: plural(camelCase(name)),
});
