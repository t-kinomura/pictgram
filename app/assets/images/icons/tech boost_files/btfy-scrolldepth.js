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
  var defaults = {
    minHeight: 0,
    elements: [],
    percentage: true,
    userTiming: true,
    pixelDepth: true,
    nonInteraction: true,
    gaGlobal: false,
    gtmOverride: false,
    trackerName: false,
    dataLayer: 'dataLayer'
  };
  var $window = $(window),
  cache = [],
  scrollEventBound = false,
  lastPixelDepth = 0,
  depthEventHandler,
  elementEventHandler;

  /**
   * Plugin
   * @param  {[type]} options [description]
   * @return {[type]}         [description]
   */
  $.scrollDepth = function(options){

    var startTime = +new Date; //日付を数値として取得
    var intermediateTime = 0;

    options = $.extend({}, defaults, options);

    // minHeightよりもdocumentの高さが低い時
    if($(document).height() < options.minHeight){
      // do something
      return;
    }

    if(typeof options.depthHandler == "function"){
      depthEventHandler = options.depthHandler;
    }
    if(typeof options.elementHandler == "function" && options.elements.length > 0){
      elementEventHandler = options.elementHandler;
    }

    /**
     * check通過時のイベント発火
     * @param  {[type]} action         [type of check]
     * @param  {[type]} label          [description]
     * @param  {[type]} scrollDistance [description]
     * @param  {[type]} timing         [到達日時]
     * @param  {[type]} residence      [滞在時間]
     * @return {[type]}                [description]
     */
    function sendEvent(action, label, scrollDistance, timing, residence){
      var command = options.trackerName ? (options.trackerName + '.send') : 'send';
      if(action == "Percentage"){
        if (depthEventHandler){
          depthEventHandler({'event': 'ScrollTiming', 'eventCategory': 'Scroll Depth', 'eventAction': action, 'eventLabel': label, 'eventTiming': timing, 'residence' : residence});
        }
      }
      if(action == "Elements"){
        if (elementEventHandler){
          elementEventHandler({'event': 'ScrollTiming', 'eventCategory': 'Scroll Depth', 'eventAction': action, 'eventLabel': label, 'eventTiming': timing});
        }
      }

    }

    function calculateMarks(docHeight){
      // return {
      //   '25%' : parseInt(docHeight * 0.25, 10),
      //   '50%' : parseInt(docHeight * 0.50, 10),
      //   '75%' : parseInt(docHeight * 0.75, 10),
      //   // Cushion to trigger 100% event in iOS
      //   '100%': docHeight - 5
      // };
      return {
        '10' : parseInt(docHeight * 0.1, 10),
        '20' : parseInt(docHeight * 0.2, 10),
        '30' : parseInt(docHeight * 0.3, 10),
        '40' : parseInt(docHeight * 0.4, 10),
        '50' : parseInt(docHeight * 0.5, 10),
        '60' : parseInt(docHeight * 0.6, 10),
        '70' : parseInt(docHeight * 0.7, 10),
        '80' : parseInt(docHeight * 0.8, 10),
        '90' : parseInt(docHeight * 0.9, 10),
        // Cushion to trigger 100% event in iOS
        '100': docHeight - 5
      };
    }

    function checkMarks(marks, scrollDistance, timing){
      // Check each active mark
      // mark到達時に前のマーク到達からの時間を算出してsendEventに送出
      $.each(marks, function(key, val) {
        if ( $.inArray(key, cache) === -1 && scrollDistance >= val ) {
          sendEvent('Percentage', key, scrollDistance, timing, (timing - intermediateTime + 1)); // 深度がスキップされた時に0msecで計測されるのを防ぐため
          intermediateTime = timing; // mark到達時刻を更新
          cache.push(key);
        }
      });
    }

    function checkElements(elements, scrollDistance, timing) {
      $.each(elements, function(index, elem) {
        if ( $.inArray(elem, cache) === -1 && $(elem).length ) {
          if ( scrollDistance >= $(elem).offset().top ) {
            sendEvent('Elements', elem, scrollDistance, timing, null);
            cache.push(elem);
          }
        }
      });
    }

    function rounded(scrollDistance) {
      // Returns String
      return (Math.floor(scrollDistance/250) * 250).toString();
    }

    function init() {
      bindScrollDepth();
    }

    /*
     * Public Methods
     */

    // Reset Scroll Depth with the originally initialized options
    $.scrollDepth.reset = function() {
      cache = [];
      lastPixelDepth = 0;
      $window.off('scroll.scrollDepth');
      bindScrollDepth();
    };

    // Add DOM elements to be tracked
    $.scrollDepth.addElements = function(elems) {

      if (typeof elems == "undefined" || !$.isArray(elems)) {
        return;
      }

      $.merge(options.elements, elems);

      // If scroll event has been unbound from window, rebind
      if (!scrollEventBound) {
        bindScrollDepth();
      }

    };

    // Remove DOM elements currently tracked
    $.scrollDepth.removeElements = function(elems) {

      if (typeof elems == "undefined" || !$.isArray(elems)) {
        return;
      }

      $.each(elems, function(index, elem) {

        var inElementsArray = $.inArray(elem, options.elements);
        var inCacheArray = $.inArray(elem, cache);

        if (inElementsArray != -1) {
          options.elements.splice(inElementsArray, 1);
        }

        if (inCacheArray != -1) {
          cache.splice(inCacheArray, 1);
        }

      });

    };

    /*
     * Throttle function borrowed from:
     * Underscore.js 1.5.2
     * http://underscorejs.org
     * (c) 2009-2013 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
     * Underscore may be freely distributed under the MIT license.
     */

    function throttle(func, wait) {
      var context, args, result;
      var timeout = null;
      var previous = 0;
      var later = function() {
        previous = new Date;
        timeout = null;
        result = func.apply(context, args);
      };
      return function() {
        var now = new Date;
        if (!previous) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0) {
          clearTimeout(timeout);
          timeout = null;
          previous = now;
          result = func.apply(context, args);
        } else if (!timeout) {
          timeout = setTimeout(later, remaining);
        }
        return result;
      };
    }


    /*
     * Scroll Event
     */

    function bindScrollDepth() {

      scrollEventBound = true;

      $window.on('scroll.scrollDepth', throttle(function() {
        /*
         * We calculate document and window height on each scroll event to
         * account for dynamic DOM changes.
         */

        var docHeight = $(document).height(),
          winHeight = window.innerHeight ? window.innerHeight : $window.height(),
          scrollDistance = $window.scrollTop() + winHeight,

          // Recalculate percentage marks
          marks = calculateMarks(docHeight),

          // Timing
          timing = +new Date - startTime;

        // If all marks already hit, unbind scroll event
        // option.percentage == true のとき、Object.keys(marks).lengthを適用するので10。
        // calculateMarksの返り値を変更するときは都度同じ長さに変更すること。
        if (cache.length >= options.elements.length + (options.percentage ? 10:0)) {
          $window.off('scroll.scrollDepth');
          scrollEventBound = false;
          return;
        }

        // Check specified DOM elements
        if (options.elements) {
          checkElements(options.elements, scrollDistance, timing);
        }

        // Check standard marks
        if (options.percentage) {
          checkMarks(marks, scrollDistance, timing);
        }
      }, 500));

    }

    init();

  };
  // UMD export
  return $.scrollDepth;
}($__btfly)));
