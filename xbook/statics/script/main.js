var mubook = angular.module("mubook", ["ngRoute", "ngCookies"]);

mubook.run(["$location", "$rootScope", "$window", "Global",
function($location, $rootScope, $window, Global) {
  $window.$rootScope = $rootScope;

  $rootScope.jumpTo = function(url) {
    $window.location.href = url;
  };

  $rootScope.$on("$routeChangeSuccess", function(event, current) {
    if (!!current.params.subjectCode) {
      $rootScope.pageTitle = current.params.subjectCode.toUpperCase() + current.$$route.title;
    } else if (!!current.params.username) {
      $rootScope.pageTitle = current.params.username + current.$$route.title;
    }
  });

  $rootScope.gotoSubject = function gotoSubject(code) {
    Global.code = code;
    Global.selected = code;
    $location.path("/explorer/" + Global.reqType + "/melbourne/" + code);
  };

  $rootScope.gotoUser = function gotoUser(username) {
    $location.path("/profile/" + username);
  };

  $rootScope.setSelected = function setSelected(code) {
    Global.selected = code || Global.code;
  };

  $rootScope.getSelected = function getSelected() {
    return Global.selected;
  };

  $rootScope.extend = function(data) {
    console.log(this, data);
    angular.extend(this, data);
  };
}]);

mubook.run(["$window", "PopupControl", function($window, PopupControl) {
  $($window).on("keyup", function(event) {
    if (event.which === 27) {
      PopupControl.closeAll();
    }
  }).on("click", function(event) {
    if (event.which === 1) {
      PopupControl.closeAll();
    }
  });
}]);

mubook.factory("Subjects", function($http) {
  return $http.get("/ajax/u-melbourne/subject_list");
});

mubook.factory("Global", function($cookies) {
  var loadTree = function(type, code, fail) {
    url = "/ajax/u-melbourne/" + type + "/" + code;
    visualizeGraph(url, fail);
    $cookies.subjCode = code;
  };

  return {
    loadTree: loadTree,
    code: "COMP30018",
    reqType: "prereq",
    selected: "COMP30018"
  };
});

mubook.directive("expandable", function() {
  return {
    scope: {
      widthMin: "@",
      widthMax: "@",
      heightMin: "@",
      heightMax: "@"
    },
    restrict: "A",
    controller: function($scope) {
      this.toggle = function() {
        var targetStatus = {};

        if ($scope.expanded) {
          if ($scope.widthMin) {
            angular.extend(targetStatus, { width: $scope.widthMin });
          }
          if ($scope.heightMin) {
            angular.extend(targetStatus, { height: $scope.heightMin });
          }
        } else {
          if ($scope.widthMax) {
            angular.extend(targetStatus, { width: $scope.widthMax });
          }
          if ($scope.heightMax) {
            angular.extend(targetStatus, { height: $scope.heightMax });
          }
        }

        $scope.morph(targetStatus);
      };
    },
    link: function(scope, elem, attrs) {
      scope.expanded = attrs.expanded !== undefined;

      scope.morph = function(targetStatus) {
        scope.expanded = !scope.expanded;
        elem.css(targetStatus);
      };
    }
  };
});

mubook.directive("expandableTrigger", function() {
  return {
    scope: false,
    restrict: "A",
    require: "^expandable",
    link: function(scope, elem, attr, expandable) {
      scope.toggle = expandable.toggle.bind(expandable);
    }
  };
});

mubook.directive("popup", function() {
  return {
    restrict: "A",
    link: function(scope, elem, attr) {
      elem.on("click", function(event) { event.stopPropagation(); });
    }
  };
});

mubook.factory("PopupControl", ["$rootScope", "$timeout", function($rootScope, $timeout) {
  var popups = {},
      visiblePopups = {};

  function Popup() {
    this.visible = false;
    this.standalone = false;
    this.group = "default";
    this.scope = null;
  }

  Popup.prototype.onOpen = Popup.prototype.onClose = Popup.prototype.onToggle = function() {};
  Popup.prototype.open = function() { this.visible = true; return this; };
  Popup.prototype.close = function() { this.visible = false; return this; };

  function closeHelper(group) {
    if (!group) { return; }
    var popup = visiblePopups[group];
    popup && popup.close();
    visiblePopups[group] = undefined;
  }

  var controller = {
    register: function(key, config) {
      if (popups[key]) { throw key + " already exists"; }
      if (!config.scope) { throw "Required parameter is missing: scope"; }

      var popup = popups[key] = new Popup;

      angular.extend(popup, config);

      return function(options) {
        if (popup.visible) {
          if (popup.onClose(options) !== false) { popup.close(); }
        } else {
          controller.closeAll(popup.group);

          if (popup.onOpen(options) !== false) { popup.open(); }

          if (!popup.standalone) {
            visiblePopups[popup.group] = popup;
          }
        }
        popup.onToggle(options);
      };
    },

    visibilityOf: function(key) {
      return function() {
        return popups[key].visible;
      };
    },

    closeAll: function(group) {
      if (group === undefined) {
        for (var group in visiblePopups) {
          closeHelper(group);
        }
      } else {
        closeHelper(group);
      }
      $rootScope.$applyAsync();
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

  $scope.gotoSubject = function(code) {
    $scope.$parent.gotoSubject(code);
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

mubook.controller("UICtrl", function UICtrl($scope, $cookies, Global, PopupControl) {
  Global.code = $cookies.subjCode;

  $scope.toggleUserMenu = PopupControl.register("userMenu", { scope: $scope });
  $scope.menuVisible = PopupControl.visibilityOf("userMenu");
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
      $location.path("/explorer/prereq/melbourne/COMP30018");
  }

  Global.selected = Global.code = status.code;
  Global.reqType = status.reqType;

  Global.loadTree(status.reqType, $routeParams.subjectCode, fail.bind(null, "subject", $routeParams.subjectCode));
});

mubook.controller("LegendCtrl", function LegendCtrl($scope, $cookies, PopupControl) {
  var $legend      = $("#legend"),
      $legendGraph = $("#legendGraph").hide(),
      $openIcon    = $("#legendOpenIcon"),
      $closeIcon   = $("#legendCloseIcon").hide();

  $scope.toggleLegend = PopupControl.register("legend",
    {
      scope: $scope,
      standalone: true,
      onOpen: function() {
        $openIcon.fadeOut();
        $closeIcon.delay(500).fadeIn();
        $legend.animate({width: "170px"}, 500).animate({height: "190px"}, 500);
        $legendGraph.delay(1000).fadeIn(500);
      },
      onClose: function() {
        $closeIcon.fadeOut();
        $openIcon.delay(500).fadeIn();
        $legendGraph.fadeOut(500);
        $legend.delay(500).animate({height: "25px"}, 500).animate({width: "25px"}, 500);
        $cookies.legendSeen = true;
      }
    }
  );

  if (!$cookies.legendSeen) { $scope.toggleLegend(); }
});

mubook.controller("GraphTypeCtrl", function GraphTypeCtrl($scope, $location, Global) {
  $scope.toPre = function toPre() {
    Global.reqType = "prereq";
    $location.path("/explorer/" + Global.reqType + "/melbourne/" + Global.code);
  };

  $scope.toPost = function toPost() {
    Global.reqType = "postreq";
    $location.path("/explorer/" + Global.reqType + "/melbourne/" + Global.code);
  };

  $scope.prereq = function prereq() {
    return Global.reqType == "prereq";
  };

  $scope.onGraphPage = function() {
    return $location.path().search("/(prereq|postreq)/") != -1;
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
  $scope.toggleForm = PopupControl.register("login", { scope: $scope });
  $scope.isVisible  = PopupControl.visibilityOf("login");
});


mubook.controller("UserCtrl", function UserCtrl($scope, $timeout, $location, $routeParams, Global) {
  if (!$routeParams.username) {
    return;
  }
  visualizeGraph("/ajax/profile/" + $routeParams.username, fail.bind(null, "user", $routeParams.username));
});

mubook.controller("SubjectAddCtrl",
function SubjectAddCtrl($scope, $timeout, $route, $cookies, Global, PopupControl) {
  $scope.semesters = ["Semester 1", "Semester 2", "Summer", "Winter", "Other"];
  $scope.states = ["Studying", "Completed", "Planned", "Bookmarked"];

  var $year = $("#subjectAdderYear");
  var $semester = $("#subjectAdderSemester");
  var $state = $("#subjectAdderState");
  var $addBtn = $("#subjectAdderConfirmBtn");

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

  $scope.formDisabled = false;

  $scope.resetForm = function() {
    $scope.modelYear = (new Date).getFullYear();
    $scope.modelSemester = $scope.semesters[0];
    $scope.modelState = $scope.states[0];
  };

  $scope.addSubject = function(e) {
    if (!$scope.isValidYear()) {
      return $year.focus();
    } else if (!$scope.isValidSemester()) {
      return $semester.focus();
    } else if (!$scope.isValidState()) {
      return $state.focus();
    }

    $scope.formDisabled = true;

    payload = {
      subject: Global.selected,
      year: $scope.modelYear,
      semester: $scope.modelSemester,
      state: $scope.modelState
    };

    $.ajax({
      headers: { "X-CSRFToken": $cookies.csrftoken },
      type: 'POST',
      url: '/profile/subjects/add',
      data: payload
    })
    .done(function(message) {
      $route.reload();
    })
    .fail(function(message) {
      console.warn("Fail: " + message);
    })
    .always(function() {
      $scope.formDisabled = false;
    });
    $scope.resetForm();
    $scope.togglePopup();
  };

  $scope.deleteSubject = function(e) {
    var url = '/profile/subjects/delete/' + Global.selected;
    $.ajax({
      headers: { "X-CSRFToken": $cookies.csrftoken },
      type: 'POST',
      url: url
    })
    .done(function(message) {
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

mubook.factory("GeneralStatistics", function($http) {
  return function(code) {
    return $http.get("/ajax/subjects/" + code + "/general_statistics");
  };
});

mubook.factory("SocialStatistics", function($http) {
  return function(code) {
    return $http.get("/ajax/subjects/" + code + "/social_statistics");
  };
});

mubook.filter("state", function() {
  return function(list, state) {
    return _.where(list, { state: state }).length;
  };
});

mubook.controller("StatisticsCtrl", ["$scope", "$routeParams", "GeneralStatistics", "SocialStatistics", "PopupControl",
function StatisticsCtrl($scope, $routeParams, GeneralStatistics, SocialStatistics, PopupControl) {
  var updateStatistics = function(event, target) {
    GeneralStatistics(target || $routeParams.subjectCode).success($scope.extend.bind($scope));
    SocialStatistics(target || $routeParams.subjectCode).success($scope.extend.bind($scope));
  };

  var toggleFriendsList = PopupControl.register("friendsList", { scope: $scope });
  $scope.friendsListVisible = PopupControl.visibilityOf("friendsList");

  $scope.toggleFriendsList = function(state) {
    $scope.filteredFriends = _.where($scope.friends, { state: state });
    toggleFriendsList();
  };

  $scope.gotoUser = function(username) {
    $scope.$parent.gotoUser(username);
    toggleFriendsList();
  };

  $scope.$on("$routeChangeSuccess", updateStatistics.bind(null, null, $routeParams.subjectCode));
  $scope.$on("selectedSubjectChange", updateStatistics);
}]);

var fail = function(type, name) {
  $("#selectedName").text("Oops!");
  $("#selectedCode").text("The " + type + " " + $routeParams.subjectCode + " does not exist.");
};
