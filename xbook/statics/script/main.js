var mubook = angular.module("mubook", ["ngRoute"]);

mubook.config(["$routeProvider", "$locationProvider",
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    $routeProvider
      .when("/profile/:username", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "UserCtrl"
      })
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
    if (!!current.params.subjectCode) {
      $rootScope.pageTitle = current.params.subjectCode.toUpperCase() + current.$$route.title;
    } else if (!!current.params.username) {
      $rootScope.pageTitle = current.params.username + current.$$route.title;
    }
  });
}]);

mubook.run(["$location", "Global", "$rootScope", function($location, Global, $rootScope) {
  $rootScope.replacePath = function replacePath(code) {
    Global.code = code;
    Global.selected = code;
    $location.path(Global.reqType + "/melbourne/" + code);
  };

  $rootScope.setSelected = function setSelected(code) {
    Global.selected = code || Global.code;
  }

  $rootScope.getSelected = function getSelected() {
    return Global.selected;
  }
}]);

mubook.run(["$window", "PopupControl", function($window, PopupControl) {
  $($window).on("keyup", function(event) {
    if (event.keyCode === 27) {
      PopupControl.closeOpened();
    }
  }).on("click", function() {
    PopupControl.closeOpened();
  });
}]);

mubook.factory("Subjects", function($http) {
  return $http.get("/ajax/u-melbourne/subjectlist");
});

mubook.factory("Global", function() {
  return {
    code: "COMP30018",
    reqType: "prereq",
    selected: "COMP30018",
    semesters:
    [
      "Summer",
      "Semester 1",
      "Winter",
      "Semester 2",
      "Other"
    ],
    states:
    [
      "Completed",
      "Studying",
      "Planned",
      "Bookmarked"
    ]
  };
});

mubook.directive("popup", function() {
  return {
    restrict: "A",
    link: function(scope, elem, attr) {
      $(elem).on("click", function(event) { event.stopPropagation(); });
    }
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
      if (popups[key]) { console.warn(key + " already exists"); }
      if (!config.scope) { console.warn("Required parameter is missing: scope"); }

      var popup = popups[key] = new Popup(key);

      for (var key in config) {
        popup[key] = config[key];
      }

      return function($event) {
        var onClose = popup.visible;

        if (onClose) {
          popup.close();
          popup.onClose($event);
        } else {
          this.closeOpened(popup.group);

          popup.open();
          popup.onOpen($event);

          if (!popup.standalone) {
            visiblePopups[popup.group] = popup;
          }
        }

        popup.onToggle($event);

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

mubook.controller("SearchCtrl", function SearchCtrl($scope, $timeout, Subjects, Global, PopupControl) {
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
    $scope.$parent.replacePath(code);
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
  $scope.successCallback = function(hasData) {
    var $selectedName = $("#selectedName"),
        $selectedCode = $("#selectedCode");

    if (!hasData) {
      $selectedName.text("404. Page does not exist");
      $selectedCode.text("The subject " + $routeParams.subjectCode + " does not exist.");
    }
  };

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
  Global.selected = Global.code;
  Global.reqType = status.reqType;

  loadTree(status.reqType, $routeParams.subjectCode, $scope.successCallback);
});

mubook.controller("SidePaneCtrl", function SidePaneCtrl($scope) {

});

mubook.controller("LegendCtrl", function LegendCtrl($scope, PopupControl) {
  $scope.$legend = $("#legend");
  $scope.$legendGraph = $("#legendGraph").hide();

  $scope.$openIcon = $("#legendOpenIcon");
  $scope.$closeIcon = $("#legendCloseIcon").hide();

  $scope.toggleLegend = PopupControl.register("legend",
    {
      scope: $scope,
      standalone: true,
      onOpen: function() {
        $scope.$openIcon.fadeOut();
        $scope.$closeIcon.delay(500).fadeIn();
        $scope.$legend.animate({width: "170px"}, 500).animate({height: "190px"}, 500);
        $scope.$legendGraph.delay(1000).fadeIn(500);
      },
      onClose: function() {
        $scope.$closeIcon.fadeOut();
        $scope.$openIcon.delay(500).fadeIn();
        $scope.$legendGraph.fadeOut(500);
        $scope.$legend.delay(500).animate({height: "25px"}, 500).animate({width: "25px"}, 500);
        docCookies.setItem("legendSeen", true);
      }
    }
  );

  if (!docCookies.getItem("legendSeen")) { $scope.toggleLegend(); }
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

  $scope.onGraphPage = function() {
    return $location.path().search("^/(prereq|postreq)/") != -1;
  }
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
    };

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

mubook.controller("LoginCtrl", function LoginCtrl($scope, $http, $timeout, Global, PopupControl) {
  $scope.toggleForm = PopupControl.register("login",
    { scope: $scope }
  );

  $scope.isVisible = PopupControl.visibilityOf("login");
});


mubook.controller("UserCtrl", function UserCtrl($scope, $timeout, $location, $routeParams, Global) {
  $scope.visualizeUserGraph = function(username) {
    $location.path("/profile/" + username);
  };

  $scope.successCallback = function(hasData) {
    var $selectedName = $("#selectedName"),
        $selectedCode = $("#selectedCode");

    if (!hasData) {
      $selectedName.text("404. Page does not exist");
      $selectedCode.text("The user " + $routeParams.username + " does not exist.");
    }
  }

  if (!$routeParams.username) {
    return;
  }
  visualizeGraph("/ajax/profile/" + $routeParams.username, $scope.successCallback);
});

mubook.controller("SubjectAddCtrl", function SubjectAddCtrl($scope, $timeout, $route, Global, PopupControl) {
  $scope.semesters = Global.semesters;
  $scope.states = Global.states;

  $scope.$year = $("#subjectAdderYear");
  $scope.$semester = $("#subjectAdderSemester");
  $scope.$state = $("#subjectAdderState");
  $scope.$addBtn = $("#subjectAdderConfirmBtn")
  $scope.$toggleBtn = $("#subjectAdderAddBtn");
  $scope.$addForm = $("#subjectAdderForm")

  $scope.togglePopup = PopupControl.register("addSubject", {
    scope: $scope,
    onOpen: function() {
      $scope.resetForm();
    }
  });

  $scope.toggleDelPopup = PopupControl.register("delSubject", {
    scope: $scope,
    onOpen: function() {
      $scope.delSubjCode = Global.selected;
    }
  });

  $scope.isVisible = PopupControl.visibilityOf("addSubject");

  $scope.isDelVisible = PopupControl.visibilityOf("delSubject");

  $scope.selected = function() {
    return Global.selected;
  };

  $scope.isValidYear = function() {
    return !($scope.subjectAdderForm.subjectYear.$error.min || $scope.subjectAdderForm.subjectYear.$error.max);
  };

  $scope.isValidSemester = function() {
    return !!$scope.subjectAdderForm.subjectSemester.$viewValue;
  };

  $scope.isValidState = function() {
    return !!$scope.subjectAdderForm.subjectState.$viewValue;
  };

  $scope.disableForm = function() {
    $scope.$year.prop('disabled', true);
    $scope.$semester.prop('disabled', true);
    $scope.$state.prop('disabled', true);
    $scope.$addBtn.prop('disabled', true);
  };

  $scope.enableForm = function() {
    $scope.$year.prop('disabled', false);
    $scope.$semester.prop('disabled', false);
    $scope.$state.prop('disabled', false);
    $scope.$addBtn.prop('disabled', false);
  };

  $scope.resetForm = function() {
    // Prefill with current semester details
    $scope.modelYear = (new Date).getFullYear();
    $scope.modelSemester = $scope.semesters[3];
    $scope.modelState = $scope.states[1];
  };

  $scope.addSubject = function(e) {
    if (!$scope.isValidYear()) {
      $scope.$year.focus();
      return;
    } else if (!$scope.isValidSemester()) {
      $scope.$semester.focus();
      return;
    } else if (!$scope.isValidState()) {
      $scope.$state.focus();
      return;
    }

    $scope.disableForm();

    payload = {
      subject: Global.selected,
      year: $scope.modelYear,
      semester: $scope.modelSemester,
      state: $scope.modelState
    };

    $.ajax({
      headers: { "X-CSRFToken": docCookies.getItem("csrftoken") },
      type: 'POST',
      url: '/profile/selected_subjects/add/',
      data: payload
    })
    .done(function(message) {
      alert(message);
      $route.reload();
    })
    .fail(function(message) {
      console.warn("Fail: " + message);
    })
    .always(function() {
      $scope.enableForm();
    });
    $scope.resetForm();
    $scope.togglePopup();
  };

  $scope.deleteSubject = function(e) {
    var url = '/profile/selected_subjects/delete/' + Global.selected + '/';
    $.ajax({
      headers: { "X-CSRFToken": docCookies.getItem("csrftoken") },
      type: 'POST',
      url: url
    })
    .done(function(message) {
      alert(message);
      $route.reload();
    })
    .fail(function(message) {
      console.warn("Fail: " + message);
    })
    .always(function() {
      $scope.toggleDelPopup(e);
    });
  };
});

mubook.controller("SocialCtrl", function SocialCtrl($scope, PopupControl) {
    $scope.togglePopupCompleted = PopupControl.register("togglePopupCompleted", { scope: $scope });
    $scope.togglePopupPlanned = PopupControl.register("togglePopupPlanned", { scope: $scope });
    $scope.togglePopupStudying = PopupControl.register("togglePopupStudying", { scope: $scope });
    $scope.togglePopupBookmarked = PopupControl.register("togglePopupBookmarked", { scope: $scope });

    $scope.isVisibleCompleted = PopupControl.visibilityOf("togglePopupCompleted");
    $scope.isVisiblePlanned = PopupControl.visibilityOf("togglePopupPlanned");
    $scope.isVisibleStudying = PopupControl.visibilityOf("togglePopupStudying");
    $scope.isVisibleBookmarked = PopupControl.visibilityOf("togglePopupBookmarked");

});


function loadTree(type, code, callback) {
  url = "/ajax/u-melbourne/" + type + "/" + code;
  visualizeGraph(url, callback);
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
