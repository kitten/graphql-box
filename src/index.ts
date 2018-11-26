import { AbstractLevelDOWN } from 'abstract-leveldown';

import level from './level';
import { makeSchemaDefinition } from './internal';
import { genSchema } from './schema';

export const makeExecutableSchema = (sdl: string, leveldown: AbstractLevelDOWN) =>
  genSchema(level(leveldown), makeSchemaDefinition(sdl));
