const sleepPromise = (ms) => { return new Promise(resolve => setTimeout(resolve, ms)); }
export default sleepPromise;
