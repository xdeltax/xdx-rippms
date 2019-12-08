export const arrayMoveElementByIndex = (arr, fromIndex, toIndex) => { arr.splice(toIndex, 0, arr.splice(fromIndex, 1)[0]); }
/*
Array.prototype.move = function(from, to) {
  this.splice(to, 0, this.splice(from, 1)[0]);
};
*/

export const arrayMove = (arr, fromIndex, toIndex) => {
    let element = arr[fromIndex];
    arr.splice(fromIndex, 1);
    arr.splice(toIndex, 0, element);
}

export function moveSafe(array, oldIndex, newIndex) {
  if (newIndex >= array.length) {
      newIndex = array.length - 1;
  }
  array.splice(newIndex, 0, array.splice(oldIndex, 1)[0]);
  return array;
}

/*
function moveObjectAtIndex(array, sourceIndex, destIndex) {
    var placeholder = {};
    // remove the object from its initial position and
    // plant the placeholder object in its place to
    // keep the array length constant
    var objectToMove = array.splice(sourceIndex, 1, placeholder)[0];
    // place the object in the desired position
    array.splice(destIndex, 0, objectToMove);
    // take out the temporary object
    array.splice(array.indexOf(placeholder), 1);
}

*/
