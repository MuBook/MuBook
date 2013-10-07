/**
 * Index General Control
 * - Init
 * - Event
 * - Cookie
 * - etc.
 */
var graph = document.getElementById("graph");
var inp = document.getElementById("searchInput");



function loadTree(code){
  code = code || "comp30018";
  url = "http://projectxbook.herokuapp.com/ajax/u-123/subject/" + code;
  graph.innerHTML = "";
  visualizeGraph(url);
  docCookies.setItem("subjCode", code);
}

// docCookies
// credit:https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
var docCookies = {
  getItem: function (sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function (sKey, sValue, vEnd, sPath, sDomain, bSecure) {
    if (!sKey || /^(?:expires|max\-age|path|domain|secure)$/i.test(sKey)) { return false; }
    var sExpires = "";
    if (vEnd) {
      switch (vEnd.constructor) {
      case Number:
        sExpires = vEnd === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + vEnd;
        break;
      case String:
        sExpires = "; expires=" + vEnd;
        break;
      case Date:
        sExpires = "; expires=" + vEnd.toUTCString();
        break;
      }
    }
    document.cookie = encodeURIComponent(sKey) + "=" + encodeURIComponent(sValue) + sExpires + (sDomain ? "; domain=" + sDomain : "") + (sPath ? "; path=" + sPath : "") + (bSecure ? "; secure" : "");
    return true;
  },
  removeItem: function (sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function (sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function () {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};


/**
 * Subject Searching App
 * - subject picker/filter
 */
var myApp = angular.module('SubjectGraph', []);

myApp.factory('Subjects', function($http){
  return $http.get("http://projectxbook.herokuapp.com/ajax/u-123/subjectlist");
});

myApp.factory('Global', function(){
  return {
    code: 'comp30018',
    selected: {},
    isSearching: false
  };
});

function SearchCtrl($scope, Subjects, Global){
  var curSelection = null;

  $scope.replacePath = function replacePath(code){
    loadTree(code);
    Global.isSearching = false;
    Global.code = code;
  };

  $scope.isVisiable = function isVisiable(){
    return Global.isSearching;
  };

  $scope.esc = function esc(e){
    var firstResult = document.querySelector("tr:first-child");

    if (e.keyCode == 27) {
      Global.isSearching = false;
    } else if (e.keyCode == 13) {
      var s = curSelection[0].children[0].innerHTML;
      $scope.replacePath(s);
    } else if (e.keyCode == 38) {
      $prev = $(curSelection).prev();
      if ($prev.length == 0) {
        curSelection = firstResult;
      } else {
        $(curSelection).removeClass("highlight");
        curSelection = $prev;
      }
    } else if (e.keyCode == 40) {
      $next = $(curSelection).next();
      if ($next.length == 0) {
        curSelection = firstResult;
      } else {
        $(curSelection).removeClass("highlight");
        curSelection = $next;
      } 
    } 
    $(curSelection).addClass("highlight");

  };

  $scope.subjects = [{"code": "Nahhhhh", "name": "waiting for data"}];
  Subjects.success(function(data){
    $scope.subjects = data.subjList;
  }).error(function(a, b, c, d){
    console.log(a);
    console.log(b);
    console.log(c);
    console.log(d);
  });
}

function UICtrl($scope, $timeout, Global){
  $scope.getCode = function code(){
    return Global.code;
  };
  loadTree(docCookies.getItem("subjCode"));
  Global.code = docCookies.getItem("subjCode");

  $scope.search = function search(){
    Global.isSearching = true;
    $timeout(function(){
      inp.focus();
    });
  };
}

function GraphCtrl($scope, Global){
  $scope.yell = function scream(){
    alert("fuck this!");
  };
}

function SidePaneCtrl($scope, Global){

}
