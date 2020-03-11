import deepCopy from 'tools/deepCopyObject';
import deepMerge from 'tools/deepMergeObject';

class StorePrototype {
	#__privateNonObervablesInit;

	_nonobervables = { };
	_constants = { };

	store = null;

	constructor(_store) {
		this.store = _store || null;
	}


	saveInitialState = (_nonobervables) => {
		if (_nonobervables) this.#__privateNonObervablesInit = deepCopy(_nonobervables);
	}


	deepCopyArrayOrObject = (a) => JSON.parse(JSON.stringify(a));
	shallowCopyArray = (a) => Array.from(a);
	deepCopy = (a) => deepCopy(a);
	deepMerge = (a) => deepMerge(a);

	get constants() { return this._constants; }
	set constants(v) { this._constants = v; }

	get nonobervables() { return this._nonobervables; }
  set nonobervables(v) { this._nonobervables = v; }

	reset = () => {
		/*recover init-state*/
		this.nonobervables = deepCopy(this.#__privateNonObervablesInit);
	};

  clear = () => {
		this.clear_all()
	};

  clear_all = () => {
		Object.keys(this.nonobervables).forEach( (prop) => this.nonobervables[prop] = deepCopy(this.#__privateNonObervablesInit[prop]) );
	};

  clear_obj = (obj) => { this[obj] = deepCopy(this.#__privateNonObervablesInit[obj]) };

	get_all()    { return this.nonobervables };
	get_obj(obj) { return this.nonobervables.hasOwnProperty(obj) ? this.nonobervables[obj] : null };

	set_all = (value) => { if (!value) return false; this.nonobervables = deepCopy(value) || {} };
	set_obj = (target, value) => { if (!target || !value || !this.nonobervables.hasOwnProperty(target)) return false; this.nonobervables[target] = deepCopy(value) || {}; return true; };

	merge_all = (value) => { if (!value) return false; this.nonobervables = deepMerge(true, this.nonobervables, value); return true; };
	merge_obj = (target, value) => { if (!target || !value || !this.nonobervables.hasOwnProperty(target)) return false; this.nonobervables[target] = deepMerge(true, this._nonobervables[target], value  || {}); return true; };


	merge = (path, val) => { // store.xxx.set("debug.auth.xxx", value) -> this.debug.auth.xxx = value
		let arr = path.split(".");
		arr.push(val);
    const {modthis, obj2modify, value} = this._parse(arr, this._nonobervables);
    modthis[obj2modify] = value;
    return true;
  };


	// set: if you set an object the new object will replayce the existing object. missing values will get lost. use merge if you want to keep them
	set = (path, val) => { // store.xxx.set("debug.auth.xxx", value) -> this.debug.auth.xxx = value
		let arr = path.split(".");
		arr.push(val);
    const {modthis, obj2modify, value} = this._parse(arr, this._nonobervables);
    modthis[obj2modify] = value;
    return true;
  };


	_parse = (arr, target) => {
    const value = arr[arr.length - 1]; // last element of array is the value to set
    arr.pop(); // remove last arr-item
    const obj2modify = arr[arr.length - 1]; // last element of array is the variable to modify
    arr.pop(); // remove last arr-item

    let modthis = target; // this._obervables
    for (const obj of arr) { // other arr-elements are the object tree
      modthis = modthis[obj];
    } // -> this._obervables[obj1][obj2][...]
    //global.log("set ------------> ", toJS(modthis), obj2modify, modthis[obj2modify], value, );
    return { modthis: modthis, obj2modify: obj2modify, value: value };
  }
}

export default StorePrototype;
