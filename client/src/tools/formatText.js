export const padEnd = (num, x) => num.toString().padEnd(x || 0);
export const padStart = (num, x, fillPattern) => num.toString().padStart(x || 0, fillPattern || "");

// pads the current string with another string (multiple times, if needed) until the resulting string reaches the given length.
export const leftFillNum = (num, targetLength) => num.toString().padStart(targetLength, 0);

export const toFixed = (num, targetDigits) => num.toFixed(targetDigits || 8);

export const now = () => new Date()
export const nowTimePretty = (s) => now().toLocaleTimeString;
export const nowDatePretty = (s) => now().toLocaleDateString;
export const nowUnixtime = (s) => now() / 1000;
