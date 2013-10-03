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
  url = "ajax/u-123/subject/" + code;
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
  return $http.get("ajax/u-123/subjectlist");
});

myApp.factory('GlobalCV', function(){
  return {
    code: 'comp30018',
    isSearching: false
  };
});

function SearchCtrl($scope, Subjects, GlobalCV){
  $scope.replacePath = function replacePath(code){
    loadTree(code);
    GlobalCV.isSearching = false;
    GlobalCV.code = code;
  };

  $scope.isVisiable = function isVisiable(){
    return GlobalCV.isSearching;
  };

  $scope.esc = function esc(e){
    if (e.keyCode == 27) {
      // e.preventDefault();
      GlobalCV.isSearching = false;
    } else if (e.keyCode == 13) {
      var s = document.querySelector("tr:first-child").children[0].innerHTML;
      $scope.replacePath(s);
    }
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

function UICtrl($scope, $timeout, GlobalCV){
  $scope.getCode = function code(){
    return GlobalCV.code;
  };
  loadTree(docCookies.getItem("subjCode"));
  GlobalCV.code = docCookies.getItem("subjCode");
  $scope.search = function search(){
    GlobalCV.isSearching = true;
    $timeout(function(){
      inp.focus();
    });
  };
}
