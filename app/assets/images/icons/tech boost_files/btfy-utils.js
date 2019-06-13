/* eslint-disable */
(function(factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD
    define(['$__btfly'], factory);
  } else if (typeof module === 'object' && module.exports) {
    // CommonJS
    module.exports = factory(require('$__btfly'));
  } else {
    // Browser globals
    factory($__btfly);
  }
}(function($) {
  "use strict";
  $.utils = function(){};
  $.utils.calc = {
    nonZero : function(elm, index, array){
      return (elm > 0);
    }
  }
  // $.utils.array = function(){};
  $.utils.array = {
    cutOffZero : function(array){
      if(Object.prototype.toString.call(array).slice(8, -1) != "Array"){
        throw new TypeError("this is not array object");
        return;
      }
      return array.filter($.utils.calc.nonZero);

    },
    trimMin : function(array){
      if(Object.prototype.toString.call(array).slice(8, -1) != "Array"){
        throw new TypeError("this is not array object");
        return;
      }
      array.splice(array.indexOf(Math.min.apply(null, array)), 1);
      return array;
    },
    sum : function(array){
      if(Object.prototype.toString.call(array).slice(8, -1) != "Array"){
        throw new TypeError("this is not array object");
        return;
      }
      var sum = 0;
      for(var i = 0; i < array.length; i++){
        sum += array[i];
      }
      return sum;

    }
  };
  return $.utils;
}($__btfly)));
