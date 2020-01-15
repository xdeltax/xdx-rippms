import { timeNow } from "./datetime.mjs";

export const clog = (mainProp, ...restProps) => {
  //if (process.env.CONSOLELOG_TARGET === "console") {
    if (process.env.CONSOLELOG_PRETTY) {
      console.log(`${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`, restProps);
    } else {
      const formatStr = Array.isArray(restProps) ? restProps.map((item) => ` ${item}`) : restProps;
      console.log(`${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`,`${formatStr}`);
      //console.log(`${process.env.CONSOLELOG || ""}${timeNow()}::${mainProp}`,`${restProps}`);
    }
  //}
}


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
