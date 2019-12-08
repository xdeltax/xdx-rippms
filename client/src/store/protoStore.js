import {decorate, action, runInAction, observable, toJS, } from 'mobx';
import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';

class Store {
	_obervables = { }
	_helpers = { }
	_constants = { }

	constructor() {
	}

	get constants() { return this._constants; }
	set constants(v) { runInAction(() => { this._constants = v; }) }

	get obervables() { return this._obervables; }
  set obervables(v) { runInAction(() => { this._obervables = v; }) }

	get helpers() { return this._helpers; }
  set helpers(v) { runInAction(() => { this._helpers = v; }) }

  get_all() { return toJS(this.obervables) };
	get_obj(obj) { return this.obervables.hasOwnProperty(obj) ? toJS(this.obervables[obj]) : null };

  set_all 	= action((value) => { if (!value) return false; this.obervables = deepCopy(value) || {} });
	set_obj 	= action((target, value) => { if (!target || !value || !this.obervables.hasOwnProperty(target)) return false; this.obervables[target] = deepCopy(value) || {}; return true; });

  merge_all = action((value) => { if (!value) return false; this.obervables = deepMerge(true, this.obervables, value); return true; });
	merge_obj = action((target, value) => { if (!target || !value || !this.obervables.hasOwnProperty(target)) return false; this.obervables[target] = deepMerge(true, this._obervables[target], value  || {}); return true; });

	// merge: if you set a value its same as "set". if you set an object the new values will be merged into existing object
  merge = action((path, val) => { // store.xxx.set("debug.auth.xxx", value) -> this.debug.auth.xxx = value
		let arr = path.split(".");
		arr.push(val);
    const {modthis, obj2modify, value} = this._parse(arr);
    modthis[obj2modify] = value;
    return true;
  });

	// set: if you set an object the new object will replayce the existing object. missing values will get lost. use merge if you want to keep them
	set = action((path, val) => { // store.xxx.set("debug.auth.xxx", value) -> this.debug.auth.xxx = value
		let arr = path.split(".");
		arr.push(val);
    const {modthis, obj2modify, value} = this._parse(arr);
    modthis[obj2modify] = value;
    return true;
  });




	_parse = (arr) => {
    const value = arr[arr.length - 1]; // last element of array is the value to set
    arr.pop(); // remove last arr-item
    const obj2modify = arr[arr.length - 1]; // last element of array is the variable to modify
    arr.pop(); // remove last arr-item

    let modthis =  this._obervables;
    for (const obj of arr) { // other arr-elements are the object tree
      modthis = modthis[obj];
    } // -> this._obervables[obj1][obj2][...]
    //global.log("set ------------> ", toJS(modthis), obj2modify, modthis[obj2modify], value, );
    return { modthis: modthis, obj2modify: obj2modify, value: value };
  }
}

decorate(Store, {
  _obervables: observable,
  _helpers: observable,
});

export default Store;
