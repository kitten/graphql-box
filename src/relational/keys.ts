import { AbstractIteratorOptions } from 'abstract-leveldown';
import cuid from 'cuid';

const CHAR_END = '\xff';
const CHAR_SEPARATOR = '!';
const SEPARATOR_LENGTH = 1;
const ID_LENGTH = 25;

export const genId = (): string => cuid().slice(0, ID_LENGTH);

export const gen2DKey = (a: string, b: any): string => a + CHAR_SEPARATOR + (b as string);

export const gen3DKey = (a: string, b: any, c: any): string =>
  a + CHAR_SEPARATOR + (b as string) + CHAR_SEPARATOR + (c as string);

export const rangeOfKey = (input: string): AbstractIteratorOptions => {
  const gt = input + CHAR_SEPARATOR;
  const lt = gt + CHAR_END;
  return { gt, lt };
};

export const idOfKey = (name: string, key: any): string => {
  const start = name.length + SEPARATOR_LENGTH;
  const end = start + ID_LENGTH;
  return (key as string).slice(start, end);
};

export const fieldOfKey = (name: string, key: any): string =>
  (key as string).slice(name.length + 2 * SEPARATOR_LENGTH + ID_LENGTH);
