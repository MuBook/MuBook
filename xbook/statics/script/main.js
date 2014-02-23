var mubook = angular.module("mubook", ["ngRoute"]);

mubook.config(["$routeProvider",
  function($routeProvider) {
    $routeProvider
      .when("/:reqType/:university/:subjectCode", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "GraphCtrl"
      })
      .otherwise({
        redirectTo: "/prereq/melbourne/" + (docCookies.getItem("subjCode") || "comp30018")
      });
  }
]);

mubook.run(["$location", "$rootScope", function($location, $rootScope) {
  $rootScope.$on("$routeChangeSuccess", function(event, current) {
    $rootScope.pageTitle = current.params.subjectCode + current.$$route.title;
  });
}]);

mubook.run(["$location", "Global", "$rootScope", function($location, Global, $rootScope) {
  $rootScope.replacePath = function replacePath(code) {
    Global.isSearching = false;
    Global.code = code;
    $location.path(Global.reqType + "/melbourne/" + code);
  };
}]);

mubook.factory("Subjects", function($http) {
  return $http.get("ajax/u-melbourne/subjectlist");
});

mubook.factory("Global", function() {
  return {
    code: "COMP30018",
    reqType: "prereq",
    isSearching: false,
    filterIndex: 0,
    filterList: []
  };
});

mubook.factory("$searchResult", function() {
  return $("#searchResult");
});

mubook.constant("HighlightHeight", 25);

mubook.controller("SearchCtrl", function SearchCtrl($scope, $timeout, Subjects, Global, $searchResult, HighlightHeight) {
  $scope.$input = $("#searchInput");

  $scope.search = function search() {
    Global.isSearching = true;
    $scope.resetSearchHighlight();
    $scope.$input.select();
    $timeout(function() {
      $scope.$input.focus();
    });
  };

  $scope.followHighlight = function followHighlight() {
    $searchResult.scrollTop((Global.filterIndex - 11) * HighlightHeight);
  };

  $scope.resetSearchHighlight = function resetSearchHighlight() {
    for (var i = Global.filterList.length - 1; i >= 0; --i) {
      Global.filterList[i].classList.remove("highlight");
    }

    Global.filterList = document.querySelectorAll("#searchResult tr");

    Global.filterIndex = 0;
    Global.filterList[Global.filterIndex].classList.add("highlight");

    $searchResult.scrollTop(0);
  };

  $scope.highlightUp = function highlightUp() {
    if (Global.filterIndex > 0) {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      Global.filterIndex -= 1;
      Global.filterList[Global.filterIndex].classList.add("highlight");
    }
  };

  $scope.highlightDown = function highlightDown() {
    if (Global.filterIndex < Global.filterList.length - 1) {
      Global.filterList[Global.filterIndex].classList.remove("highlight");
      Global.filterIndex += 1;
      Global.filterList[Global.filterIndex].classList.add("highlight");
    }
  };

  $searchResult.on("wheel", function(e) {
    e.preventDefault();
    var deltaY = e.originalEvent.wheelDeltaY || -e.originalEvent.deltaY;
    if (deltaY > 0) {
      $scope.highlightUp();
    } else {
      $scope.highlightDown();
    }
    $scope.followHighlight();
  });

  $scope.move = function move(e) {
    if (e.keyCode == 38) {
      $scope.highlightUp()
    } else if (e.keyCode == 40) {
      $scope.highlightDown();
    } else if (e.keyCode == 13) {
      $scope.replacePath(Global.filterList[Global.filterIndex].dataset["code"]);
    } else {
      $timeout(function() {
        $scope.resetSearchHighlight();
        $scope.followHighlight();
      });
      return;
    }
    $scope.followHighlight();
  };

  $scope.isVisiable = function isVisiable() {
    return Global.isSearching;
  };

  $scope.esc = function esc(e) {
    if (e.keyCode == 27) {
      Global.isSearching = false;
    }
  };

  $scope.subjects = [{"code": "Nahhhhh", "name": "waiting for data"}];
  Subjects.success(function(data) {
    $scope.subjects = data.subjList;
  }).error(function() {
    alert("Failed to load subjects list");
  });
});

mubook.controller("UICtrl", function UICtrl($scope, Global) {
  Global.code = docCookies.getItem("subjCode");
});

mubook.controller("GraphCtrl", function GraphCtrl($scope, $routeParams, $location, Global) {
  var status = { code: $routeParams.subjectCode };

  switch ($routeParams.reqType) {
    case "prereq":
      status.reqType = "prereq";
      break;
    case "postreq":
      status.reqType = "postreq";
      break;
    default:
      $location.path("/prereq/melbourne/COMP30018");
  }

  Global.code = status.code;
  Global.reqType = status.reqType;

  loadTree(status.reqType, $routeParams.subjectCode);
});

mubook.controller("SidePaneCtrl", function SidePaneCtrl($scope) {

});

mubook.controller("GraphTypeCtrl", function GraphTypeCtrl($scope, $location, Global) {
  $scope.toPre = function toPre() {
    Global.reqType = "prereq";
    $location.path(Global.reqType + "/melbourne/" + Global.code);
  };

  $scope.toPost = function toPost() {
    Global.reqType = "postreq";
    $location.path(Global.reqType + "/melbourne/" + Global.code);
  };

  $scope.prereq = function prereq() {
    return Global.reqType == "prereq";
  };
});

mubook.controller("FeedbackCtrl", function FeedbackCtrl($scope, $http, $timeout) {
  $scope.hideForm = true;

  $scope.toggleForm = function() {
    $scope.hideForm = !$scope.hideForm;
    $timeout(function() {
      $("#feedback-name").focus();
    });
  };

  $scope.sendFeedback = function(e) {
    if (!$scope.message) {
      alert("Feedback message cannot be empty!");
      e.preventDefault();
      $timeout(function() {
        $("#feedback-message").focus();
      });
      return;
    }

    var data = {
      record: {
        name:    $scope.name,
        email:   $scope.email,
        message: $scope.message
      }
    };

    $submit = $("#feedback-submit");
    $submit.val("Sending...").attr("disabled", true);

    $.ajax({
      type: 'POST',
      url: 'http://monitor.mubook.me/api/records',
      crossDomain: true,
      data: data
    })
    .done(function() {
      alert("Your feedback has been received. Thank you!");
    })
    .fail(function() {
      alert("Something went wrong, would you like to try again? Sorry...");
    })
    .always(function() {
      $submit.val("Send").attr("disabled", false);
      $scope.toggleForm();
    });
  };
});

function loadTree(type, code) {
  url = "ajax/u-melbourne/" + type + "/" + code;
  visualizeGraph(url);
  docCookies.setItem("subjCode", code);
}

// credit: https://developer.mozilla.org/en-US/docs/Web/API/document.cookie
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
