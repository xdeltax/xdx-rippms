import { fileURLToPath } from 'url';
import path from 'path';
//import { dirname } from 'path';

export const __filename = fileURLToPath(import.meta.url);
export const basepath = path.dirname(__filename);

//export const basename = () => path.basename(fileURLToPath(import.meta.url));
export const thisfile = () => fileURLToPath(import.meta.url);
export const thispath = () => path.dirname(fileURLToPath(import.meta.url));

export const abs_path = (p) => path.join(basepath, p);
//export const importX = (f) => { return import(abs_path('/' + f)) }
