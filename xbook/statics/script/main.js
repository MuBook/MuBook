/**
 * Index General Control
 * - Init
 * - Event
 * - Cookie
 * - etc.
 */
var graph = document.getElementById("graph");
var inp = document.getElementById("searchInput");
var highlightPosition = 0;

function loadTree(code){
  code = code || "comp30018";
  url = "ajax/u-123/postreq/" + code;
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
 * Object storing lower bounds and upper bounds of the highlighted result 
 */
var highlight = {
  LOWERBOUND : 2,
  UPPERBOUND : 19,
  HIGHLIGHT_HEIGHT : 25,
  NUM_ROWS : 22
};

/**
 * Subject Searching App
 * - subject picker/filter
 */
var myApp = angular.module('SubjectGraph', []);

myApp.factory('Subjects', function($http){
  return $http.get("ajax/u-123/subjectlist");
});

myApp.factory('Global', function(){
  return {
    code: 'comp30018',
    selected: {},
    isSearching: false,
    filterIndex: 0,
    filterList: null
  };
});

var $searchResult = $("#searchResult");

function SearchCtrl($scope, $timeout, Subjects, Global){

  function centerHighlight(){
    if($searchResult.scrollTop() > Global.filterIndex * highlight.HIGHLIGHT_HEIGHT ||
      $searchResult.scrollTop() + highlight.NUM_ROWS * highlight.HIGHLIGHT_HEIGHT <
       Global.filterIndex * highlight.HIGHLIGHT_HEIGHT) {
      $searchResult.scrollTop((Global.filterIndex - highlightPosition) * highlight.HIGHLIGHT_HEIGHT)
    }
  }

  $searchResult.on("wheel", function(e) {
    e.preventDefault();
    var deltaY = window.event.wheelDeltaY;
    if(deltaY > 0) {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      if (Global.filterIndex > 0) {
        Global.filterIndex -= 1;
        if(highlightPosition > highlight.LOWERBOUND) {
          highlightPosition -= 1;
        }
      }
    } else {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      if (Global.filterIndex < Global.filterList.length - 1) {
        Global.filterIndex += 1;
        if (highlightPosition < highlight.UPPERBOUND) {
          highlightPosition += 1;
        }
      }
    }
    Global.filterList[Global.filterIndex].classList.add("highlight");
    if(highlightPosition <= highlight.LOWERBOUND 
      || highlightPosition >= highlight.UPPERBOUND) {
      $searchResult.scrollTop((Global.filterIndex - highlightPosition) * highlight.HIGHLIGHT_HEIGHT);
    }
    centerHighlight();
  });

  $scope.replacePath = function replacePath(code){
    loadTree(code);
    Global.isSearching = false;
    Global.code = code;
  };

  $scope.isVisiable = function isVisiable(){
    return Global.isSearching;
  };

  $scope.esc = function esc(e){
    if (e.keyCode == 27) {
      Global.isSearching = false;
    }
  };

  $scope.handle = function handle(e){
    if (e.keyCode == 38) {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      if (Global.filterIndex > 0) {
        Global.filterIndex -= 1;
        if(highlightPosition > highlight.LOWERBOUND) {
          highlightPosition -= 1;
        }
      }
    } else if (e.keyCode == 40) {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      if (Global.filterIndex < Global.filterList.length - 1) {
        Global.filterIndex += 1;
        if (highlightPosition < highlight.UPPERBOUND) {
          highlightPosition += 1;
        }
      }
    } else if (e.keyCode == 13) {
      var s = Global.filterList[Global.filterIndex].children[0].innerHTML;
      $scope.replacePath(s);
    } else {
      $timeout(function(){
        Global.filterList = document.querySelectorAll("#searchResult tr");
        for (var i = Global.filterList.length - 1; i >= 0; --i) {
          Global.filterList[i].classList.remove("highlight");
        }
        Global.filterIndex = 0;
        Global.filterList[Global.filterIndex].classList.add("highlight");
        $searchResult.scrollTop(0);
      });
      return;
    }
    Global.filterList[Global.filterIndex].classList.add("highlight");
    if(highlightPosition <= highlight.LOWERBOUND 
      || highlightPosition >= highlight.UPPERBOUND) {
      $searchResult.scrollTop((Global.filterIndex - highlightPosition) * highlight.HIGHLIGHT_HEIGHT);
    }
    centerHighlight();
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
      Global.filterList = document.querySelectorAll("#searchResult tr");
      for (var i = Global.filterList.length - 1; i >= 0; --i) {
        Global.filterList[i].classList.remove("highlight");
      }
      Global.filterIndex = 0;
      Global.filterList[Global.filterIndex].classList.add("highlight");
      $searchResult.scrollTop(0);
    });
  };
}

function GraphCtrl($scope, Global){

}

function SidePaneCtrl($scope, Global){

}
