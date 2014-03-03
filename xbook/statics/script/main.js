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
        redirectTo: "/prereq/melbourne/" + (docCookies.getItem("subjCode") || "COMP30018")
      });
  }
]);

mubook.run(["$location", "$rootScope", function($location, $rootScope) {
  $rootScope.$on("$routeChangeSuccess", function(event, current) {
    if (!current.params.subjectCode) { return; }
    $rootScope.pageTitle = current.params.subjectCode.toUpperCase() + current.$$route.title;
  });
}]);

mubook.run(["$location", "Global", "$rootScope", function($location, Global, $rootScope) {
  $rootScope.replacePath = function replacePath(code) {
    Global.code = code;
    $location.path(Global.reqType + "/melbourne/" + code);
  };
}]);

mubook.run(["$window", "PopupControl", function($window, PopupControl) {
  $($window).on("keyup", function(event) {
    if (event.keyCode === 27) {
      PopupControl.closeOpened();
    }
  });
}]);

mubook.factory("Subjects", function($http) {
  return $http.get("ajax/u-melbourne/subjectlist");
});

mubook.factory("Global", function() {
  return {
    code: "COMP30018",
    reqType: "prereq"
  };
});

mubook.factory("PopupControl", ["$timeout", function($timeout) {
  var popups = {},
      visiblePopups = {};

  function Popup(id) {
    this.visible = false;
    this.standalone = false;
    this.group = "default";
    this.scope = null;
  }

  Popup.prototype.onOpen = function() {};
  Popup.prototype.onClose = function() {};
  Popup.prototype.onToggle = function() {};
  Popup.prototype.open = function() { this.visible = true; };
  Popup.prototype.close = function() { this.visible = false; };

  function closeHelper(group) {
    var popup;
    var thePopup = popup = visiblePopups[group];
    popup.close();
    $timeout(function() {
      thePopup.scope.$apply();
    });
    popup = undefined;
  }

  var controller = {
    register: function(key, config) {
      if (popups[key] !== undefined) { console.warn(key + " already exists"); }
      if (!config.scope) { console.warn("Required parameter is missing: scope"); }

      var popup = popups[key] = new Popup(key);

      for (var key in config) {
        popup[key] = config[key];
      }

      return function() {
        var onClose = popup.visible;

        if (onClose) {
          popup.close();
          popup.onClose();
        } else {
          this.closeOpened(popup.group);

          popup.open();
          popup.onOpen();

          if (!popup.standalone) {
            visiblePopups[popup.group] = popup;
          }
        }

        popup.onToggle();

      }.bind(controller);
    },

    visibilityOf: function(key) {
      return function() {
        return popups[key].visible;
      };
    },

    closeOpened: function(group) {
      if (group === undefined) {
        for (var group in visiblePopups) {
          if (!visiblePopups[group]) { continue; }
          closeHelper(group);
        }
      } else if (visiblePopups[group]) {
        closeHelper(group);
      }
    }
  };

  return controller;
}]);

mubook.factory("$searchResult", function() {
  return $("#searchResult");
});

mubook.controller("SearchCtrl", function SearchCtrl($scope, $timeout, $rootScope, Subjects, Global, PopupControl, $searchResult) {
  $scope.$input = $("#searchInput");

  $scope.toggleSearch = PopupControl.register("search",
    {
      scope: $scope,
      onOpen: function() {
        $scope.$input.select();
        $timeout(function() {
          $scope.$input.focus();
        });
      }
    }
  );

  $scope.replacePath = function(code) {
    $rootScope.replacePath(code);
    $scope.toggleSearch();
  };

  $scope.isVisible = PopupControl.visibilityOf("search");

  $scope.subjects = [{"code": "Placeholder", "name": "waiting for data"}];

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

mubook.controller("LegendControl", function LegendControl($scope, PopupControl) {
  visualizeGraphHelper();
  $scope.toggle = PopupControl.register("legend",
    {
      scope: $scope,
      standalone: true
    }
  );

  $scope.isVisible = PopupControl.visibilityOf("legend");
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

mubook.controller("FeedbackCtrl", function FeedbackCtrl($scope, $http, $timeout, Global, PopupControl) {
  $scope.toggleForm = PopupControl.register("feedback",
    {
      scope: $scope,
      onOpen: function() {
        $timeout(function() {
          $("#feedback-name").focus();
        });
      }
    }
  );

  $scope.isVisible = PopupControl.visibilityOf("feedback");

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
