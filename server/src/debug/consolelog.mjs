import { fileURLToPath } from 'url';
import path from 'path';

import { timeNow } from "../tools/datetime.mjs";

const debuglog = (_pre) => {
  //const xlog = (...args) => clog(_pre, args);
  const startTime = new Date();
  const xlog = (mainProp, ...restProps) => {
    const nowTime = new Date();

    const basename = path.basename(fileURLToPath(_pre));
    const formatted_pre = ((basename + " ") || "").toString().padEnd(7);

    const diffTime = (nowTime-startTime);
    const formatted_diffTime = !(diffTime < 60 * 1000)
    ? diffTime.toString().padEnd(5) // 10000 = 10 sec
    : `${(Math.floor(diffTime/60000)).toString().padStart(2)}m${diffTime.toString().padEnd(2)}`;  //10m5s
    //const formatted_diffTime = (nowTime-startTime).toString().padStart(5, "0");

    console.log(`${process.env.CONSOLELOG || ""}${formatted_pre}${nowTime.toLocaleTimeString()}+${formatted_diffTime} ${mainProp}`, restProps, ``);
  }
  return xlog;
}

export default debuglog;

/*
export const clog = (mainProp, ...restProps) => {
  //if (process.env.CONSOLELOG_TARGET === "console") {
    if (process.env.CONSOLELOG_PRETTY) {
      console.log(`${_pre || ""}${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`, restProps);
    } else {
      const formatStr = Array.isArray(restProps) ? restProps.map((item) => ` ${item}`) : restProps;
      console.log(`${_pre || ""}${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`,`${formatStr}`);
      //console.log(`${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`,`${restProps}`);
    }
  //}
};
*/

/*
let num = 3
let str = num.toString().padStart(3, "0")
console.log(str) // "003"

let num = 3.141
let arr = num.toString().split(".")
arr[0] = arr[0].padStart(3, "0")
let str = arr.join(".")
console.log(str) // "003.141"
*/


/*
export class DEBUGLOG {
  constructor(_pre) {
    this.pre = _pre || "";
  }
  log = (args) => { clog("test", this.pre, args);}
  //return console.log("x")
}
*/

/*
//process.stdout.write(`${timeNow()} ${restArgs} ${'\n'}`);
//console.trace();
//console.log(getStackTrace());
//console.log(getBaseClass(clog));
//var parentProto = Object.getPrototypeOf(clog);
//console.log(clog.name);

var getStackTrace = function() {
  var obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

function getBaseClass(targetClass){
  if(targetClass instanceof Function){
    let baseClass = targetClass;

    while (baseClass){
      const newBaseClass = Object.getPrototypeOf(baseClass);

      if(newBaseClass && newBaseClass !== Object && newBaseClass.name){
        baseClass = newBaseClass;
      }else{
        break;
      }
    }

    return baseClass;
  }
}
*/
