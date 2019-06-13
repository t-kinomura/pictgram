/* eslint-disable */
(function($) {

  var P_PREFIX     = "_BTFY";
  var BTCK_EXPIRES = 60;
  var BT_INF_PRM  = "_bthash";
  var JSON = $.json

  /**
   * ルートドメインを取得する
   * @return {String}
   */
  var getRoot = function(){
    var i=0,domain=$.__BT_APP_PARAMS["P_DOMAIN"],p=domain.split('.'),s='_gd'+(new Date()).getTime();
    while(i<(p.length-1) && document.cookie.indexOf(s+'='+s)==-1){
         domain = p.slice(-1-(++i)).join('.');
         document.cookie = s+"="+s+";domain="+domain+";";
    }
    document.cookie = s+"=;expires=Thu, 01 Jan 1970 00:00:01 GMT;domain="+domain+";";
    return domain;
  }
  // subdomainを利用するしない場合、cookieのドメインは常にそのページのドメインとするため
  // rootdomainはnullとする(not nullの時、setCookieされたもののdomainは.が先頭につくため)
  var rootdomain = !$.__BT_APP_PARAMS["BT_USE_SUBDOMAIMN"] ? null : getRoot();

  $.ajaxSetup({xhrFields:{withCredentials:true}});

  /**
   * cookieのプロパティ設定
   * @param  {number} expire 引数なしなら空白をセット
   * @return {Object}            [description]
   */
  var propCookie = function(expire){
      var prop = {
          path:"/",
          domain:rootdomain
      };
      if(expire){
          prop.expires = expire;
      }
      return prop;
  };


  // デバイスチェック用
  var GadgetUtil = (function(u){
    return {
      device : {
        tablet:(u.indexOf("windows") != -1 && u.indexOf("touch") != -1 && u.indexOf("tablet pc") == -1)
          || u.indexOf("ipad") != -1
          || (u.indexOf("android") != -1 && u.indexOf("mobile") == -1)
          || (u.indexOf("firefox") != -1 && u.indexOf("tablet") != -1)
          || u.indexOf("kindle") != -1
          || u.indexOf("silk") != -1
          || u.indexOf("playbook") != -1
        ,mobile:(u.indexOf("windows") != -1 && u.indexOf("phone") != -1)
          || u.indexOf("iphone") != -1
          || u.indexOf("ipod") != -1
          || (u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
          || (u.indexOf("firefox") != -1 && u.indexOf("mobile") != -1)
          || u.indexOf("blackberry") != -1
        ,androidMb:(u.indexOf("android") != -1 && u.indexOf("mobile") != -1)
      },
      os : {
        ios : (u.indexOf("iphone") != -1 || u.indexOf("ipad") != -1 || u.indexOf("ipod") != -1)
      }
    }
  })(window.navigator.userAgent.toLowerCase());

  // デバイスチェック用
  var getDv = function() {
    if (GadgetUtil.device.tablet) {
      // タブレット
      return 30;
    } else if (GadgetUtil.device.mobile) {
      // モバイル
      return 20;
    } else {
      // PC
      return 10;
    }
  };

  // 新規or 再訪フラグ
  var getRp = function() {
    // セッションクッキーがない場合のみカウントUP
    if (!$.cookie(P_PREFIX + "-rps")) {
        // 再訪クッキー
      if ($.cookie(P_PREFIX + "-rp")) {
        // 再訪
        var n = Number($.cookie(P_PREFIX + "-rp")) + 1;
        $.cookie(P_PREFIX + "-rp", n, propCookie(BTCK_EXPIRES));
      } else {
        // 新規
        $.cookie(P_PREFIX + "-rp", 1, propCookie(BTCK_EXPIRES));
      }
      // セッションクッキー
      $.cookie(P_PREFIX + "-rps", 1, propCookie());
    }
    if(!$.cookie(P_PREFIX + "-rp")) {
      // セッションクッキーはあるが再訪クッキーが有効期限切れなら再定義
      $.cookie(P_PREFIX + "-rp", 1, propCookie(BTCK_EXPIRES));
    }
    return Number($.cookie(P_PREFIX + "-rp"));
  };

  /**
   * 編集HTMLを適用
   */
  var btUser = function(datas) {
    // ユーザIDの割り当て
    if (datas.hasOwnProperty("btuid")) {
      $.cookie(P_PREFIX + "-uid", datas["btuid"], propCookie(BTCK_EXPIRES));
    }
    // セッション中有効のユーザIDの割り当て
    if (datas.hasOwnProperty("btsuid")) {
      $.cookie(P_PREFIX + "-suid", datas["btsuid"], propCookie());
    }
  };

  var btExecScript = function (script, command) {
    if (script) {
      var func = [script, "//# sourceURL=btfy-" + command +".js" ].join("\n")
      try {
        new Function(func)();
      } catch (e) {
        console.error(e)
        throw new Error(command)
      }
    }
  }

  /**
   * 編集HTMLを適用
   */
  var btEdhtml = function(datas) {
    // 編集内容適用指示があるかどうか
    if (datas.hasOwnProperty("eds")) {
      var eds = datas["eds"];
      if (eds) {
        $.each(eds, function(i, d) {
          if (d.command === 'exec-pre-script' || d.command === 'exec-post-script') {
            btExecScript(d.text, d.command);
            return true;
          }
          if (d) { d.selector = d.selector.replace(/^html.*? > /, 'html > ') }
          if (d && $(d.selector).length > 0) {
            switch(d.command) {
              case "delete-element":
                $(d.selector).css('display', 'none')
                break;
              case "update-imagesrc":
                $(d.selector).attr("src", d.after);
                break;
              case "update-text":
                $(d.selector).prop('innerHTML', d.after);
                break;
              case "update-add-element":
                    switch(d.position) {
                      case "beforebegin":
                        $(d.selector).before(d.add);
                      break;
                      case "afterbegin":
                        $(d.selector).prepend(d.add);
                      break;
                      case "beforeend":
                        $(d.selector).append(d.add);
                      break;
                      case "afterend":
                        $(d.selector).after(d.add);
                      break;
                }
                break;
              default:
                $(d.selector).prop('outerHTML', d.after);
              break;
            }
          }
        });
      }
    }
  };

  /**
   * pvビーコン生成
   */
  var btPvElement = function(datas) {
    // ビーコン生成
    if (datas.hasOwnProperty("bcus") && datas["bcus"]) {
      var i = 0;
      while(i < datas["bcus"].length){
        if(!$.scrollDepth && datas["bcus"][i].match(/\/bt\.sd/)){
          // scrollDepthが読み込まれていない状態では繊維率のビーコンの生成は飛ばす
          i = (i+1)|0;
          continue;
        }
        btAddElement(datas["bcus"][i]);
        i = (i+1)|0;
      }
    }
  };

  /**
   * imgエレメント(オブジェクト)追加
   */
  var btAddElement = function(bc) {
    if (bc) {
      var el = document.createElement("img");
      el.setAttribute("src", bc);
      el.setAttribute("style", "display:none;width:1px;height:1px;");
      document.body.appendChild(el);
    }
  };

    /**
     * 指定URLからクエリストリングパラメータマップを生成
     */
  var btGetPrm = function (url) {
    var prm={};
    if(!url){
      return prm;
    }
    var q = url.split('?');
    if (!q || q.length < 2) {
      return prm;
    }
    var p=q[1].split('&');
    if(!p){
      return prm;
    }
    for(var i=0;p[i];i++) {
      var kv = p[i].split('=');
      prm[decodeURIComponent(kv[0])]=decodeURIComponent(kv[1]);
    }
    return prm;
  };

  /**
   * 指定URLからクエリストリングパラメータマップを生成
   */
  var btInflow = function () {
    /**
     * 流入元情報をクエリストリングから削除する
     * @param  {String} hash [description]
     * @return void      [description]
     */
    var trimInflowFromUrl = function(hash) {
      var tmp = $.__BT_APP_PARAMS["P_URL"].replace("?" + BT_INF_PRM + "=" + hash,"");
      tmp = tmp.replace("&" + BT_INF_PRM + "=" + hash,"");
      // _bthashが削除された後、?から始まるクエリストリングがなければ先頭の&を?に置換する。
      $.__BT_APP_PARAMS["P_URL"] = tmp.indexOf("?") < 0 ? tmp.replace("&", "?") : tmp;
    }
    if ($.cookie(P_PREFIX + "-iwhs")) {
      // 設定済みなら_bthashの値を削除してreturn
      trimInflowFromUrl($.cookie(P_PREFIX + "-iwhs"));
      return;
    }
    // hrefから流入元HASHパラメータの取得を試みる
    var btPrms = btGetPrm(location.href);
    if (btPrms.hasOwnProperty(BT_INF_PRM)) {
      // first partyクッキーとして保存
      $.cookie(P_PREFIX + "-iwhs", btPrms[BT_INF_PRM], propCookie());
      // urlのbthashは削除
      trimInflowFromUrl(btPrms[BT_INF_PRM]);
    } else {
      // とれない場合はさらにリファラーからの取得も試みる
      var rBtPrms = btGetPrm(document.referrer);
      if (rBtPrms.hasOwnProperty(BT_INF_PRM)) {
        // first partyクッキーとして保存
        $.cookie(P_PREFIX + "-iwhs", rBtPrms[BT_INF_PRM], propCookie());
        // urlのbthashは削除
        trimInflowFromUrl(rBtPrms[BT_INF_PRM]);
      }
    }
  };



  // 管理画面経由かどうか
  var isBtWin = function () {
    if (window.opener
      && !window.opener.closed
      && window.name == "butterflyWindow") {
      return true;
    }
    return false;
  };

  // N秒置きにクッキー加算
  var btTimeLoad = function () {
    var sp = 10;
    $.cookie(P_PREFIX + "-srtm", 0, propCookie());
    var sil = setInterval(function(){
      var tm = $.cookie(P_PREFIX + "-srtm");
      tm = parseInt(tm)+sp;
      $.cookie(P_PREFIX + "-srtm", tm, propCookie());
      // 300秒超えたら終了
      if (tm >= 300) {
          clearInterval(sil);
      }
    } , sp*1000);
  };

  // make event obj
  var makeEvent = function(eventName) {
    if(typeof window.Event !== "function") {
      // create event when IE
      var evt = document.createEvent('Event');
      evt.initEvent(eventName, true, false);
      return evt;
    }
      return new Event(eventName);
  };

  /**
   * efo連携のためのカスタムイベント発火
   * @return {[type]}           [description]
   */
  var sendEvent = function(){
    if(typeof window.efocube  === 'object') {
      // efocubeがapply.jsより先に実行されていたらデータの整合性を取るためにaccesslog再送
      // butterflyが仕込んだcookieを反映して正しいデータを得るため
      window.dispatchEvent(makeEvent("btfy_event_resend_log"));
      return;
    }
    // efocubeの読み込みがまだされていない（正常系）の時のイベント
    window.dispatchEvent(makeEvent("btfy_event_initialize_page"));
    return;
  };

  /**
   * 読了率計測データの送信
   * @param  {String} bev               pagehide || beforeunload
   * @param  {Object} datas             settnings
   * @param  {Object} depthData         user's scroll data
   * @param  {Object} lastResidenseData the last section an user were in before leave the page
   * @param  {Object} vpgs              user's visited page list in the story
   * @return {[type]}                   [description]
   */
  var attachScrollDepth = function(bev, datas, depthData, lastResidenseData, vpgs){
    $(window).on(bev, function(e){
      //-----------------------------------------------------------------
      //読了率
      //-----------------------------------------------------------------
      var u = datas["dpbc"]["bcu"]
      , preset = datas["dpbc"]["prm"]
      , dataset = {}
      , sum, len;
      for(var key in depthData){
        if(key == lastResidenseData["depth"]){
          // 最後に滞留した箇所の滞留時刻を計算
          depthData[key].push(Math.ceil((new Date() - lastResidenseData["time"]) / 1000));
        }
        sum = 0;
        depthData[key] = $.utils.array.cutOffZero(depthData[key]);
        len = depthData[key].length;
        if(len < 1){
          // len が 0になるときは異常系 or 集計対象外なのでスキップ
          continue;
        }
        // 滞留時間の合計求める
        sum = $.utils.array.sum(depthData[key]);
        if(len > 3){
          // セクションの滞留時間リストが4以上なら一番小さいものを除外して以下の処理を行う
          // cookieには過去の滞留時間のうち大きい方から3つのみ残すため
          depthData[key] = $.utils.array.trimMin(depthData[key]);
        }
        dataset = $.extend(preset, {"dep": parseInt(key), "ret":Math.ceil((sum / len) / 10) * 10, "trn": 1});
        createBeacon(u, dataset);
      }
      // セッション中有効なcookieに滞留時間を仕込む
      if(datas["stst"] == 9){
        // 終了ステータスならログの収集後に保持時間クッキーを全てけす
        if (!vpgs){
          return
        }
        vpgs = vpgs.split(','); // ,で分割
        vpgs.pop(); // vpgsの最後尾には""が挿入されるが不要なため
        vpgs.forEach(function(vpg){
          $.cookie(P_PREFIX + "-sdr-" + datas["pt"] + "-" + vpg, JSON.stringify(depthData), {path:"/", expires: -1})
        });
      } else {
        // そうでないなら登録する
        $.cookie(P_PREFIX + "-sdr-" + datas["pt"] + "-" + datas["pg"], JSON.stringify(depthData), propCookie(BTCK_EXPIRES))
      }
    });
  }
  function markingHref(settings, pt, pg) {
    /**
     * 正規化関数
     * @param  {[type]} qS  [description]
     * @param  {[type]} url [description]
     * @return {[type]}     [description]
     */
    var generalize = function(url, qS, isDevide) {
      var path = getUrlPath(url);
      if(!isDevide && path) {
        // 大文字小文字を区別しない場合、pathの全ての文字列を小文字に変換する
        url = url.replace(path, path.toLowerCase())
      }
      if (qS.length === 0) {
        return url;
      }
      qS.forEach(function(q) {
        url = url.replace(new RegExp('(\\?|&)(' + q + '=)[\\w]+'), '$1$2');
      });
      return url;
    };
    var getUrlPath = function(url) {
      try {
        return url.match(/^https?:\/{2,}.*?(\/.*)/)[1].split("?")[0]
      } catch (e) {
        return null
      }
    }
    settings.forEach(function(setting) {
      // ストーリーに紐づけられているリンクの設定の数だけパラメータ付与処理を行う
      // match条件に何も設定されていない時には任意の文字列をmatch条件とする
      var matchReg = setting.match_pattern ? new RegExp(setting.match_pattern) : new RegExp('.*');
      // exclude条件に何も設定されていないならhttpで始まらない任意の文字列を除外条件とする
      var excludeReg =setting.exclude_pattern ? new RegExp(setting.exclude_pattern) : new RegExp('^(?!http)');
      var joint, href, url, qParams;
      var nodeList = document.querySelectorAll('a');
      var node = Array.prototype.slice.call(nodeList,0);
      node.forEach(function(el){
        // ページ内にある全てのanchorタグについて以下をチェックし、hrefの変換を試みる
        href = el.href;
        if(!href.match(matchReg) || href.match(excludeReg)) {
          // match条件を満たしていない、もしくは除外条件を満たしている場合skip
          return;
        }
        // hrefのmatch条件を満たし、exclude条件を満たしていない場合は監視対象とする
        joint = '?';
        url = href;
        qParams = btGetPrm(href);
        if(qParams.hasOwnProperty('_btLinkTrack') && qParams.hasOwnProperty('_btLinkUrl')) {
          // 先勝ちのためすでにhrefが変更されている場合更新させない
          return;
        }
        // urlの正規化
        url = generalize(href, setting.ignore_params.split(","), setting.devide_chara_case);
        if(Object.keys(qParams).length > 0) {
          // クエリパラメータが存在すればjointの値を変更
          joint = '&';
        }
        // ここまでくればhrefを変更する
        el.href = el.href + joint + '_btLinkTrack=' + pt + '.' + pg + '.' + setting.id + '&_btLinkUrl=' + encodeURIComponent(url) + '&_btLinkCanonical=' + setting.use_canonical;
      });
    });
  }

  /**
   * リンク計測対象のデータ送信
   * @return {[type]} [description]
   */
  function sendLinkInfo(){
    if(!$.cookie(P_PREFIX + "-suid")) {
      // そもそもいずれかのstoryがstartしていなければ計測を行わない
      return;
    }
    var getRelCanonical = function() {
      var cUrl;
      var rel = document.querySelector("head > link[rel='canonical']");
      if(rel) {
        // rel=canonicalなlinkタグがあるならそれを取得
        cUrl = rel.href;
      }
      return cUrl;
    };
    // location.hrefの取得
    var href = location.href;
    // クエリストリングの取得
    var qParams = btGetPrm(href);
    var qPKeys = Object.keys(qParams);
    if(qPKeys.length > 0) {
      // P_URLの改変
      var trimmed = '';
      for(var j =0; j < qPKeys.length; j =(j+1)|0) {
        if(qPKeys[j] === '_btLinkTrack' || qPKeys[j] === '_btLinkUrl' || qPKeys[j] === '_btLinkCanonical') {
          continue;
        }
        trimmed += '&' + qPKeys[j] + '=' + qParams[qPKeys[j]]
      }
      trimmed = trimmed === '' ? trimmed : trimmed.replace("&", "?");
      $.__BT_APP_PARAMS["P_URL"] = location.origin + $.__BT_APP_PARAMS["P_PATH"] + trimmed;

    }
    if(!qParams.hasOwnProperty('_btLinkTrack') || !qParams.hasOwnProperty('_btLinkUrl') || !qParams.hasOwnProperty('_btLinkCanonical')) {
      // リンク計測用のパラメータが一つでもかけていれば何もしない
      return;
    }
    if(qParams['_btLinkCanonical'] === '1') {
      // rel=canonicalを見る設定だった場合はcanonical urlの取得を試みる
      var cUrl = getRelCanonical();
      if(cUrl) {
        // cUrlが取得できればパラメータの変更を行う。
        qParams['_btLinkUrl'] = cUrl;
        href.replace(new RegExp('(_btLinkUrl=)https?%3A%2F%2F[a-zA-Z0-9%\\.-]+'), '$1'+encodeURIComponent(cUrl));
      }
    }
    // create beacon
    var lndata = $.cookie(P_PREFIX + '-lntr') ? JSON.parse($.cookie(P_PREFIX + '-lntr')): {};
    var lnkey = qParams['_btLinkTrack'] + '_' + qParams['url']
    if(lndata.hasOwnProperty(qParams['_btLinkTrack']) >= 0){
      var lnUrls = lndata[qParams['_btLinkTrack']] ? lndata[qParams['_btLinkTrack']] : [];
      if(lnUrls.indexOf(qParams['_btLinkUrl']) >= 0) {
        // cookieに登録済みのurlなら何もしない
        return;
      }
      lnUrls.push(qParams['_btLinkUrl']);
      lndata[qParams['_btLinkTrack']] = lnUrls;
    }
    var keys = qParams['_btLinkTrack'].split(".")
    var d  ={
      pt: keys[0],
      pg: keys[1],
      aid: keys[2],
      suid: $.cookie(P_PREFIX + "-suid"),
      url: qParams['_btLinkUrl'],
      rp: getRp(),
      dv: getDv(),
      trn: 0
    }
  //                  below create invisible img asynchronously
    createBeacon($.__BT_APP_PARAMS["BT_LINK_INS"], d)
    $.cookie(P_PREFIX + '-lntr', JSON.stringify(lndata), propCookie(BTCK_EXPIRES));
  }

  /**
   * 計測設定の付与
   * @param {[type]} settings [description]
   * @param {[type]} pt       [description]
   * @param {[type]} pg       [description]
   */
  function setClickAnalysis(settings, pt, pg) {
    function attachEvents(setting, pt, pg) {
      // touchstartが存在するならそちらを捕捉する。そうでなければclickを捕捉する
      var ev = window.ontouchstart === null ? "touchstart" : "click";
      if(getDv() === 10) {
        // deviceがpcの場合touchstartがあってもclickにする
        // touchstartだけだとmouseのclickに対応できないため
        ev = "click";
      }
      $(document).on(ev, setting["selector"], function(){
        var ckId = setting["id"];
        var clickData = $.cookie(P_PREFIX + '-clicktr') ? JSON.parse($.cookie(P_PREFIX + '-clicktr')): {};
        if(clickData.hasOwnProperty(ckId)) {
          return;
        }
        clickData[ckId] = {
          pt: pt,
          pg: pg,
          ckid: ckId
        };
        var d  ={
          pt: pt,
          pg: pg,
          ckid: ckId,
          suid: $.cookie(P_PREFIX + "-suid"),
          rp: getRp(),
          dv: getDv(),
          trn: 0
        }
        createBeacon($.__BT_APP_PARAMS["BT_CLICK_INS"], d)
        $.cookie(P_PREFIX + '-clicktr', JSON.stringify(clickData), propCookie(BTCK_EXPIRES));
      });
    }
    for(var i = 0; i < settings.length; i = (i + 1)|0) {
      attachEvents(settings[i], pt, pg);
    }
  }

  /**
   * リンク計測結果を更新する
   * @return {[type]} [description]
   */
  function updateLnToCV() {
    // リンク計測を行なっている場合、保存されている全ての遷移についてcvフラグを立てる。
    var lnlog = $.cookie(P_PREFIX + "-lntr") ? JSON.parse($.cookie(P_PREFIX + "-lntr")) : {};
    var lnkeys = Object.keys(lnlog);
    for (var i = 0; i < lnkeys.length; i = (i+1)|0) {
      var keys = lnkeys[i].split(".");
      var d  ={
        pt: keys[0],
        pg: keys[1],
        aid: keys[2],
        suid: $.cookie(P_PREFIX + "-suid"),
        trn: 1
      }
      // below create invisible img asynchronously
      createBeacon($.__BT_APP_PARAMS["BT_LINK_UPD"], d)
    }
  }

  /**
   * クリック計測結果を更新する
   * @return {[type]} [description]
   */
  function updateCkToCV() {
    var cklog = $.cookie(P_PREFIX + "-clicktr") ? JSON.parse($.cookie(P_PREFIX + "-clicktr")) : {};
    for (var key in cklog) {
      cklog[key]["suid"] = $.cookie(P_PREFIX + "-suid")
      cklog[key]["trn"] = 1
      createBeacon($.__BT_APP_PARAMS["BT_CLICK_UPD"], cklog[key])
    }
  }
  /**
   * 計測ビーコンの出力
   * @param  {[type]} url  [description]
   * @param  {[type]} data [description]
   * @return {[type]}      [description]
   */
  function createBeacon (url, data) {
    var u =  url + encodeURIComponent(JSON.stringify(data));
    var img = new Image(1, 1);
    img.onload = function(){
      document.body.appendChild(img);
    }
    img.src = u;
  }

  /**
   * メイン処理
   */
  $(document).ready(function () {

    if (!isBtWin()){
      // location.hrefの値を見て、リンク計測対象であればログを飛ばす。
      sendLinkInfo();
      // N秒置きにクッキー加算
      btTimeLoad();
      // 流入元の保存を試みる
      btInflow();
    }

    // ユーザID
    var uid = $.cookie(P_PREFIX + "-uid");
    // ユーザID (セッション)
    var suid = $.cookie(P_PREFIX + "-suid");
    // ストーリーステータス
    var stst = $.cookie(P_PREFIX + "-stst");
    // 入力元HASHキー
    var iwh = $.cookie(P_PREFIX + "-iwhs");
    // パターンークッキー
    var pt = $.cookie(P_PREFIX + "-pt");
    // ページ履歴IDリスト
    var pgs = $.cookie(P_PREFIX + "-spgs");
    // パターンID (セッション)
    var spt = $.cookie(P_PREFIX + "-spt");
    // ページID (セッション)
    var spg = $.cookie(P_PREFIX + "-spg");

    $.ajax({
      type: 'post',
      timeout: 10000, // 10秒間
      url: location.protocol + "//" + $.__BT_APP_PARAMS["BT_DOMAIN"] + "/ajax/pull",
      data: {
        "wnm" : window.name
        ,"p_domain" : $.__BT_APP_PARAMS["P_DOMAIN"]
        ,"p_url"   : $.__BT_APP_PARAMS["P_URL"]
        ,"p_title" : document.title
        ,"cid"     : $.__BT_APP_PARAMS["BT_CID"] // クライアントID
        ,"use_scroll" : $.__BT_APP_PARAMS["BT_U_SCROLL"] // use_scroll
        ,"btuid"   : uid     // ユーザID
        ,"btsuid"  : suid     // ユーザID (セッション)
        ,"stst"    : stst    // ストーリーステータス
        ,"iwh"     : iwh     // 流入元
        ,"pt"      : pt      // パターンID
        ,"rp"      : getRp() // 再訪フラグ
        ,"dv"      : getDv() // デバイス
        ,"pgs"     : pgs     // ページ履歴IDリスト
        ,"spt"    : spt     // パターンID (セッション)
        ,"spg"    : spg     // ページID (セッション)
      },
      dataType: 'json'
    })

    // 200(OK)
    .success(function (datas) {
      if (datas) {
        // 編集内容があれば適用
        try {
          btEdhtml(datas);
        } catch (e) {
          if (e.message === 'exec-pre-script' || e.message === 'exec-post-script') {
            sendEvent();
            return;
          }
        }

        if (isBtWin()){
          return;
        }

        // ユーザIDの割り当て
        btUser(datas);

        // pgsレスポンスがある場合のみ（同一セッション中での重複時は入らない）
        if (datas.hasOwnProperty("pgs") && datas["pgs"]) {

          // impデータの送信(ビーコン生成指示がある場合のみ)
          btPvElement(datas);

          $.cookie(P_PREFIX + "-spgs", datas["pgs"], propCookie());
        }

        // ストーリー中の場合
        if (datas.hasOwnProperty("stst")) {
          // cookieから来訪ページを取得する。（cookie消去用）
          var pgs = $.cookie(P_PREFIX + "-spgs");
          // ページ切り替える瞬間
          var bev = GadgetUtil.os.ios ? 'pagehide' : 'beforeunload';
          $(window).on(bev, function(e) {
            //-----------------------------------------------------------------
            // 滞在時間
            //-----------------------------------------------------------------
            if (datas.hasOwnProperty("tmbc")) {
              if (datas["tmbc"].hasOwnProperty("bcu") && datas["tmbc"].hasOwnProperty("prm")) {
                // 滞在時間取得
                var tm = $.cookie(P_PREFIX + "-srtm");
                if (tm) {
                  datas["tmbc"]["prm"]["tm"] = parseInt(tm);
//                  below create invisible img asynchronously
                  createBeacon(datas["tmbc"]["bcu"], datas["tmbc"]["prm"])
                }
              }
            }
          });
          // 読了率プラグインの起動
          if(datas.hasOwnProperty("dpbc") && $.scrollDepth){
            if(datas["dpbc"].hasOwnProperty("bcu") && datas["dpbc"].hasOwnProperty("prm")){
              // 滞留時間の初期化
              // var depthData = {"25%" : [0], "50%" : [0], "75%" : [0], "100%" : [0]};
              var depthData = {
                "10" : [],
                "20" : [],
                "30" : [],
                "40" : [],
                "50" : [],
                "60" : [],
                "70" : [],
                "80" : [],
                "90" : [],
                "100" : []
              };
              // cookieからセッション中の滞留時間データをmerge
              var prevRetension = $.cookie(P_PREFIX + "-sdr-" + datas["pt"] + "-" + datas["pg"]);
              depthData = $.extend(depthData, prevRetension !== void 0 ? JSON.parse(prevRetension) : prevRetension);
              // ページ離脱時にいたセクションの滞留時間を得るための一時変数を定義
              var lastResidenseData = {depth : Object.keys(depthData)[0],time : +new Date};
              attachScrollDepth(bev, datas, depthData, lastResidenseData, pgs);
              $.scrollDepth({
                depthHandler : function(data){
                  var retension = Math.ceil(data['residence'] / 1000);
                  var depth = data['eventLabel'];
                  depthData[depth].push(retension);
                  lastResidenseData["depth"] = Object.keys(depthData)[(Object.keys(depthData).indexOf(depth) + 1)];
                  lastResidenseData["time"] = +new Date;
                }
              });
            }
          }

          var t = datas["stst"];
          if (t == 9) {
            updateLnToCV(); // update status(link analysis)
            updateCkToCV(); // update status(click analysis)
            // クッキークリア
            $.cookie(P_PREFIX + "-lntr", "", propCookie(-1));
            $.cookie(P_PREFIX + "-clicktr", "", propCookie(-1));
            $.cookie(P_PREFIX + "-iwhs", "", propCookie(-1));
            $.cookie(P_PREFIX + "-stst", "", propCookie(-1));
            $.cookie(P_PREFIX + "-suid", "", propCookie(-1));
            // パターンID保存
            if (datas.hasOwnProperty("pt")) {
              $.cookie(P_PREFIX + "-pt", datas["pt"], propCookie(BTCK_EXPIRES));
              $.cookie(P_PREFIX + "-spt", datas["pt"], propCookie());
            }
            // ページID保存
            if (datas.hasOwnProperty("pg")) {
              $.cookie(P_PREFIX + "-pg", datas["pg"], propCookie(BTCK_EXPIRES));
              $.cookie(P_PREFIX + "-spg", datas["pg"], propCookie());
            }
            setTimeout(function(){
              $.cookie(P_PREFIX + "-pt", "", propCookie(-1));
              $.cookie(P_PREFIX + "-pg", "", propCookie(-1));
            }, 5000);
            $.cookie(P_PREFIX + "-spgs", "", propCookie(-1));
            $.cookie(P_PREFIX + "-spt", "", propCookie(-1));
            $.cookie(P_PREFIX + "-spg", "", propCookie(-1));

          } else {
            // ストーリー中ならリンク計測設定がされている場合ここで適用。
            // TODO: データ取得部が完成し次第差し替える
            if(datas.hasOwnProperty("anchors") && datas.anchors) {
              markingHref(datas["anchors"], datas["pt"], datas["pg"]);
            }
            if(datas.hasOwnProperty("links") && datas["links"]) {
              // link計測用のデータがレスポンスに含まれている場合aタグへのマーキングを試みる
              markingHref(datas["links"], datas["pt"], datas["pg"]);
            }
            if(datas.hasOwnProperty("msClick") && datas["msClick"]) {
              setClickAnalysis(datas["msClick"], datas["pt"], datas["pg"]);
            }

            // クッキー保存
            $.cookie(P_PREFIX + "-stst", datas["stst"], propCookie(BTCK_EXPIRES));

            // パターンID保存
            if (datas.hasOwnProperty("pt")) {
              $.cookie(P_PREFIX + "-pt", datas["pt"], propCookie(BTCK_EXPIRES));
              $.cookie(P_PREFIX + "-spt", datas["pt"], propCookie());
            }
            // ページID保存
            if (datas.hasOwnProperty("pg")) {
              $.cookie(P_PREFIX + "-pg", datas["pg"], propCookie(BTCK_EXPIRES));
              $.cookie(P_PREFIX + "-spg", datas["pg"], propCookie());
            }

          }

        }

      }
      sendEvent();
    })

    // 200以外(NG)
    .error(function(x, e) {
      console.log("tag-btfy.geeen.co.jp - Error.");
      console.log(x);
      sendEvent();
    });

  });

})($__btfly);
