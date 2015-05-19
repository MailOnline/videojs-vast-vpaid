/**
 There is a bug on android 4.2 ont the way it parses string
 The code bellow fixes the problem if there is a problem
 */
(function () {
 var parseNum;
 if(parseInt('09') !== 9) {
  parseNum = window.parseInt;
  window.parseInt = function(str) {
   if(typeof str === 'string' && !/^(\s+)?0+(\s+)?$/.test(str)){
    //We remove the 0 from the left of the number
    return parseNum(str.replace(/^0+/, ''));
   }

   return parseNum(str)
  };
 }
})();