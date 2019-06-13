/*eslint-disable*/



(function () {


//var JQ_URL = '//code.jquery.com/jquery-3.1.1.js';
var JQ_URL = '//ajax.googleapis.com/ajax/libs/jquery/1.11.1/jquery.min.js';


var BT_SCRIPT_LIST = [
    "/assets/js/btfy-jquery.cookie.js"
    ,"/assets/js/btfy-apply.js"
];



var SCROLL_DEPTH = ["/assets/js/btfy-scrolldepth.js", "/assets/js/btfy-utils.js"];
Array.prototype.splice.apply(BT_SCRIPT_LIST, [1,0].concat(SCROLL_DEPTH));




var isPrototypeJsEarlierThan1_7 = function () {
  return (typeof window.Prototype === 'object' &&
    parseFloat(window.Prototype.Version.substr(0,3)) < 1.7)
}


var btflyUtil = {
  json: {
    stringify: (function () {
      var _json_stringify = JSON.stringify;
      if (isPrototypeJsEarlierThan1_7()) {
        return function (value) {
          var _array_tojson = Array.prototype.toJSON;
          delete Array.prototype.toJSON;
          var json = _json_stringify(value);
          Array.prototype.toJSON = _array_tojson;
          return json;
        }
      }
      return JSON.stringify;
    })(),
    parse: JSON.parse
  }
}





var val = "";
var BT_APP_PARAMS = {};
BT_APP_PARAMS["BT_DOMAIN"] = "tag-btfy.geeen.co.jp/tag";
BT_APP_PARAMS["BT_LINK_INS"] = "//tag-btfy.geeen.co.jp/ms/la.ins?json=";
BT_APP_PARAMS["BT_LINK_UPD"] = "//tag-btfy.geeen.co.jp/ms/la.upd?json=";
BT_APP_PARAMS["BT_CLICK_INS"] = "//tag-btfy.geeen.co.jp/ms/ca.ins?json=";
BT_APP_PARAMS["BT_CLICK_UPD"] = "//tag-btfy.geeen.co.jp/ms/ca.upd?json=";
BT_APP_PARAMS["P_DOMAIN"]  = location.hostname;
BT_APP_PARAMS["P_PATH"]    = location.pathname;
BT_APP_PARAMS["P_URL"]     = location.href;
BT_APP_PARAMS["P_QUERY"]   = location.search;
BT_APP_PARAMS["P_HASH"]    = location.hash;
BT_APP_PARAMS["BT_CID"]    = Number("109");
BT_APP_PARAMS["BT_U_SCROLL"] = Number("1");



//console.log(BT_APP_PARAMS);

// butterfly用のjqueryを読み込む
var btJqSetUp = function (conflict) {

	var tmp = document.createElement("script");
	tmp.type = 'text/javascript';
	tmp.src = JQ_URL;
	document.getElementsByTagName('body')[0].appendChild(tmp);
	var done = false;
	tmp.onload = tmp.onreadystatechange = function() {
        if ( !done && (!this.readyState || this.readyState === "loaded" || this.readyState === "complete") ) {
            done = true;
          $__btfly = btLoaderStartUp(conflict);
          $__btfly.extend(btflyUtil);
        }
	};
}

// butterflyのloaderを実行する
var btLoaderStartUp = function (conflict) {
	var jq = conflict ? $.noConflict(true) : $;
	var BT_DOMAIN = BT_APP_PARAMS["BT_DOMAIN"];
	if (BT_DOMAIN) {
		
		jq.getScript(location.protocol + "//" + BT_DOMAIN + "/assets/js/btfy-loader.js");
		
		jq.__BT_DOMAIN = BT_DOMAIN;
		jq.__BT_SCRIPT_LIST = BT_SCRIPT_LIST;
		jq.__BT_APP_PARAMS = BT_APP_PARAMS;
	} else {
		console.log("Unknown domain. abort the load script of butterfly.");
	}

	return jq;
}

// butterfly専用 - jqueryロード
btJqSetUp(true);

})();


