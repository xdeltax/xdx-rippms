import { timeNow } from "./datetime.mjs";

export const clog = (...restArgs) => {
  //process.stdout.write(`${timeNow()} ${restArgs} ${'\n'}`);
  console.log(timeNow(), restArgs);
}
