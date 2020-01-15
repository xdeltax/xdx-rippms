export default function arrayRemoveElementByValue(arr, value) {
  return arr.filter( function(element){ return element !== value; }) 
}
