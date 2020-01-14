import { fileURLToPath } from 'url';
import path from 'path';
//import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const basepath = path.dirname(__filename);

export const abs_path = (p) => { return path.join(basepath, p) }
export const importX = (f) => { return import(abs_path('/' + f)) }
