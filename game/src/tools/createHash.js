import crypto from "crypto";
export const fromObject = (obj) => crypto.createHash('sha1').update(JSON.stringify(obj)).digest('hex');
export const fromString = (str) => crypto.createHash('sha1').update(str).digest('hex');
