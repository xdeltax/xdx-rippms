
/**
 * Deep copy an object (make copies of all its object properties, sub-properties, etc.)
 * An improved version of http://keithdevens.com/weblog/archive/2007/Jun/07/javascript.clone
 * that doesn't break if the constructor has required parameters
 *
 * It also borrows some code from http://stackoverflow.com/a/11621004/560114
 */
function deepCopy(src, /* INTERNAL */ _visited, _copiesVisited) {
    if(src === null || typeof(src) !== 'object'){
        return src;
    }

    //Honor native/custom clone methods
    if(typeof src.clone == 'function'){
        return src.clone(true);
    }

    //Special cases:
    //Date
    if(src instanceof Date){
        return new Date(src.getTime());
    }
    //RegExp
    if(src instanceof RegExp){
        return new RegExp(src);
    }
    //DOM Element
    if(src.nodeType && typeof src.cloneNode == 'function'){
        return src.cloneNode(true);
    }

    // Initialize the visited objects arrays if needed.
    // This is used to detect cyclic references.
    if (_visited === undefined){
        _visited = [];
        _copiesVisited = [];
    }

    // Check if this object has already been visited
    var i, len = _visited.length;
    for (i = 0; i < len; i++) {
        // If so, get the copy we already made
        if (src === _visited[i]) {
            return _copiesVisited[i];
        }
    }

    //Array
    if (Object.prototype.toString.call(src) == '[object Array]') {  //eslint-disable-line
        //[].slice() by itself would soft clone
        let ret = src.slice();

        //add it to the visited array
        _visited.push(src);
        _copiesVisited.push(ret);

        let i = ret.length;
        while (i--) {
            ret[i] = deepCopy(ret[i], _visited, _copiesVisited);
        }
        return ret;
    }

    //If we've reached here, we have a regular object

    //make sure the returned object has the same prototype as the original
    var proto = (Object.getPrototypeOf ? Object.getPrototypeOf(src): src.__proto__);
    if (!proto) {
        proto = src.constructor.prototype; //this line would probably only be reached by very old browsers
    }
    var dest = object_create(proto);

    //add this object to the visited array
    _visited.push(src);
    _copiesVisited.push(dest);

    for (var key in src) {
        //Note: this does NOT preserve ES5 property attributes like 'writable', 'enumerable', etc.
        //For an example of how this could be modified to do so, see the singleMixin() function
        dest[key] = deepCopy(src[key], _visited, _copiesVisited);
    }
    return dest;
}

//If Object.create isn't already defined, we just do the simple shim,
//without the second argument, since that's all we need here
var object_create = Object.create;
if (typeof object_create !== 'function') {
    object_create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

export default deepCopy;
