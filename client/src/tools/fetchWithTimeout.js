export default (url, options = {}, ) => {
  let { timeout = 5000, ...rest } = options;
  if (rest.signal) throw new Error("Signal not supported in timeoutable fetch");
  const controller = new AbortController();
  const { signal } = controller;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("timeout for server-call"));
      controller.abort();
    }, timeout);
    fetch(url, { signal, ...rest })
      .finally(() => clearTimeout(timer))
      .then(resolve, reject);
  });
};
