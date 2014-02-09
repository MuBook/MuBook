/**
 * Index General Control
 * - Init
 * - Event
 * - Cookie
 * - etc.
 */
var highlightPosition = 0;

function loadTree(type, code) {
  code = code || "comp30018";
  url = "ajax/u-melbourne/" + type + "/" + code;
  visualizeGraph(url);
  docCookies.setItem("subjCode", code);
}

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
var app = angular.module("app", ["ngRoute"]);

app.config(["$routeProvider",
  function($routeProvider) {
    $routeProvider
      .when("/:reqType/:university/:subjectCode", {
        templateUrl: "/template",
        controller: "GraphCtrl"
      })
      .otherwise({
        redirectTo: "/prereq/melbourne/" + (docCookies.getItem("subjCode") || "comp30018")
      });
  }]);

app.factory("Subjects", function($http) {
  return $http.get("ajax/u-123/subjectlist");
});

app.factory("Global", function() {
  return {
    code: "comp30018",
    reqType: "prereq",
    selected: {},
    isSearching: false,
    filterIndex: 0,
    filterList: null
  };
});

app.factory("$searchResult", function() {
  return $("#searchResult");
});

app.controller("SearchCtrl", function SearchCtrl($scope, $timeout, $location, Subjects, Global, $searchResult) {

  $scope.centerHighlight = function centerHighlight() {
    if ($searchResult.scrollTop() > Global.filterIndex * highlight.HIGHLIGHT_HEIGHT ||
      $searchResult.scrollTop() + highlight.NUM_ROWS * highlight.HIGHLIGHT_HEIGHT <
       Global.filterIndex * highlight.HIGHLIGHT_HEIGHT) {
      $searchResult.scrollTop((Global.filterIndex - highlightPosition) * highlight.HIGHLIGHT_HEIGHT)
    }
  };

  $searchResult.on("wheel", function(e) {
    e.preventDefault();
    var deltaY = e.originalEvent.wheelDeltaY || -e.originalEvent.deltaY;
    if (deltaY > 0) {
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
    if (highlightPosition <= highlight.LOWERBOUND
      || highlightPosition >= highlight.UPPERBOUND) {
      $searchResult.scrollTop((Global.filterIndex - highlightPosition) * highlight.HIGHLIGHT_HEIGHT);
    }
    centerHighlight();
  });

  $scope.replacePath = function replacePath(code) {
    Global.isSearching = false;
    Global.code = code;
    $location.path(Global.reqType + "/melbourne/" + code);
  };

  $scope.isVisiable = function isVisiable() {
    return Global.isSearching;
  };

  $scope.esc = function esc(e) {
    if (e.keyCode == 27) {
      Global.isSearching = false;
    }
  };

  $scope.move = function move(e) {
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
      $scope.replacePath(Global.filterList[Global.filterIndex].dataset["code"]);
    } else {
      $timeout(function() {
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
    $scope.centerHighlight();
  };

  $scope.subjects = [{"code": "Nahhhhh", "name": "waiting for data"}];
  Subjects.success(function(data) {
    $scope.subjects = data.subjList;
  }).error(function() {
    alert("Failed to load subjects list");
  });
});

app.controller("UICtrl", function UICtrl($scope, $timeout, Global, $searchResult) {
  $scope.getCode = function code() {
    return Global.code;
  };

  Global.code = docCookies.getItem("subjCode");

  $scope.$input = $("#searchInput");

  $scope.search = function search() {
    Global.isSearching = true;
    $timeout(function() {
      $scope.$input.focus();
      Global.filterList = document.querySelectorAll("#searchResult tr");
      for (var i = Global.filterList.length - 1; i >= 0; --i) {
        Global.filterList[i].classList.remove("highlight");
      }
      Global.filterIndex = 0;
      Global.filterList[Global.filterIndex].classList.add("highlight");
      $searchResult.scrollTop(0);
    });
  };
});

app.controller("GraphCtrl", function GraphCtrl($scope, $routeParams, $location, Global, $searchResult) {
  var status = { code: $routeParams.subjectCode };
  switch ($routeParams.reqType) {
    case "prereq":
      status.reqType = "prereq";
      break;
    case "postreq":
      status.reqType = "postreq";
      break;
    default:
      $location.path("/prereq/melbourne/comp30018");
  }
  Global.code = status.code;
  Global.reqType = status.reqType;
  loadTree(status.reqType, $routeParams.subjectCode);

  $scope.update = function update(code) {
    Global.code = code;
    $location.path(Global.reqType + "/melbourne/" + code);
  };
});

app.controller("SidePaneCtrl", function SidePaneCtrl($scope, $location, Global) {
  $scope.reqSwitch = function reqSwitch() {
    Global.reqType = (Global.reqType == "postreq") ? "prereq" : "postreq";
    $location.path(Global.reqType + "/melbourne/" + Global.code);
  };

  $scope.reqType = function reqType() {
    return Global.reqType;
  };

  $scope.update = function update(code) {

  };
});

app.controller("FeedbackCtrl", function FeedbackCtrl($scope, $http, $timeout) {
  $scope.hideForm = true;

  $scope.toggleForm = function() {
    $scope.hideForm = !$scope.hideForm;
    $timeout(function() {
      $("#feedback-name").focus();
    });
  };

  $scope.sendFeedback = function(e) {
    if (!$scope.message) {
      alert("Feedback cannot be empty!");
      e.preventDefault();
      $timeout(function() {
        $("#feedback-message").focus();
      });
      return;
    }

    var data = {
      name:    $scope.name,
      email:   $scope.email,
      message: $scope.message
    };

    $submit = $("#feedback-submit");
    $submit.val("Sending...").attr("disabled", true);

    $http.post(
      "feedback", data,
      {
        headers: {
          "X-CSRFToken": docCookies.getItem("csrftoken")
        }
      }
    ).success(function() {
      $submit.val("Send").attr("disabled", false);
      $scope.toggleForm();
      alert("Your feedback has been received. Thank you!");
    });
  };
});

// docCookies
// credit:https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
var docCookies = {
  getItem: function(sKey) {
    return decodeURIComponent(document.cookie.replace(new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$"), "$1")) || null;
  },
  setItem: function(sKey, sValue, vEnd, sPath, sDomain, bSecure) {
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
  removeItem: function(sKey, sPath, sDomain) {
    if (!sKey || !this.hasItem(sKey)) { return false; }
    document.cookie = encodeURIComponent(sKey) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + ( sDomain ? "; domain=" + sDomain : "") + ( sPath ? "; path=" + sPath : "");
    return true;
  },
  hasItem: function(sKey) {
    return (new RegExp("(?:^|;\\s*)" + encodeURIComponent(sKey).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=")).test(document.cookie);
  },
  keys: /* optional method: you can safely remove it! */ function() {
    var aKeys = document.cookie.replace(/((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g, "").split(/\s*(?:\=[^;]*)?;\s*/);
    for (var nIdx = 0; nIdx < aKeys.length; nIdx++) { aKeys[nIdx] = decodeURIComponent(aKeys[nIdx]); }
    return aKeys;
  }
};
