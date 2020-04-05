const convert2UTC = (date) => {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), date.getHours(), date.getMinutes(), date.getSeconds()));
}

export const datetime = () => {
  return new Date();
}

export const unixtime = (_datetime) => {
  if (!_datetime) _datetime = new Date();
  return _datetime / 1000;
}

export const datetimeUTC = (_datetime) => {
  if (!_datetime) _datetime = new Date();
  return convert2UTC(_datetime);
}

export const datetimeNow = (_datetime) => {
  if (!_datetime) _datetime = new Date();
  return _datetime.now;
}

export const timeNow = (_datetime) => {
  if (!_datetime) _datetime = new Date();
  return _datetime.toLocaleTimeString();
}

export const dateNow = (_datetime) => {
  if (!_datetime) _datetime = new Date();
  return _datetime.toLocaleDateString();
}
