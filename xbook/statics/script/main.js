var mubook = angular.module("mubook", ["ngRoute", "ngAnimate", "ngCookies", "angular-loading"]);

mubook.run(["$templateCache", function($templateCache) {
  $templateCache.put("view.html", '<div id="graph"></div>');
}]);

mubook.run(["$location", "$rootScope", "$window", "Global", "visualizeGraph",
function($location, $rootScope, $window, Global, visualizeGraph) {
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

  $rootScope.gotoSubject = function gotoSubject(code, callback) {
    Global.code = code;
    Global.selected = code;
    $location.path("/explorer/" + Global.reqType + "/melbourne/" + code);

    if (callback) { callback() };
  };

  $rootScope.gotoUser = function gotoUser(username, callback) {
    $location.path("/profile/" + username);

    if (callback) { callback() };
  };

  $rootScope.loadGraph = function(type, code) {
    url = "/ajax/u-melbourne/" + type + "/" + code;
    visualizeGraph(url);
  };

  $rootScope.setSelected = function setSelected(code) {
    Global.selected = code || Global.code;
  };

  $rootScope.getSelected = function getSelected() {
    return Global.selected;
  };

  $rootScope.extend = function(data) {
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

mubook.factory("Global", function() {
  return {
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

mubook.constant("NotifyDefault", {
  duration: 5000,
  dismissable: true
});

mubook.provider("Notify", ["NotifyDefault", function(NotifyDefault) {
  var _config = NotifyDefault;

  this.config = function(config) {
    angular.extend(_config, config);
  };

  this.$get = ["$timeout", function($timeout) {
    var Notify = {
      $container: function(container) {
        _config.container = container;
      },
      $dismissable: _config.dismissable,
      $notify: function(message, status) {
        _config.container.notify(message, status);
        $timeout(function() {
          _config.container.notifications.shift();
          _config.container.$apply();
        }, _config.duration);
      },
      info: function(message) {
        this.$notify(message, 'info');
      },
      success: function(message) {
        this.$notify(message, 'success');
      },
      error: function(message) {
        this.$notify(message, 'danger');
      },
      warn: function(message) {
        this.$notify(message, 'warning');
      }
    };
    return Notify;
  }];
}]);

mubook.directive("notification", ["Notify", function(Notify) {
  return {
    restrict: "E",
    scope: true,
    templateUrl: "directives/notification.html",
    link: function(scope, elem) {
      Notify.$container(scope);

      scope.dismissable = Notify.$dismissable;

      scope.notifications = [];

      scope.notify = function(message, status) {
        scope.notifications.push({ message: message, status: status });
      };
    }
  };
}]);

mubook.controller("SearchCtrl", function SearchCtrl($scope, $timeout, Subjects, Global, PopupControl) {
  var $input = $("#searchInput");

  $scope.toggleSearch = PopupControl.register("search", {
    scope: $scope,
    onOpen: function() {
      $input.select();
    }
  });

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

  $scope.loadGraph(status.reqType, $routeParams.subjectCode);
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

  $scope.isPrereq = function prereq() {
    return Global.reqType == "prereq";
  };

  $scope.onGraphPage = function() {
    return $location.path().search("/(prereq|postreq)/") != -1;
  };
});

mubook.controller("FeedbackCtrl",
function FeedbackCtrl($scope, $http, $timeout, Global, PopupControl, Notify) {
  $scope.toggleForm = PopupControl.register("feedback", {
    scope: $scope,
    onOpen: function() {
      $timeout(function() {
        $("#feedback-name").focus();
      });
    }
  });

  $scope.isVisible = PopupControl.visibilityOf("feedback");

  $scope.sendFeedback = function(e) {
    if (!$scope.message) {
      Notify.warn("Feedback message cannot be empty!");
      e.preventDefault();
      $timeout(function() {
        $("#feedback-message").focus();
      });
      return;
    };

    var data = $.param({
      record: {
        name:    $scope.name,
        email:   $scope.email,
        message: $scope.message
      }
    });

    $submit = $("#feedback-submit");
    $submit.val("Sending...").prop("disabled", true);

    $http.post("http://monitor.mubook.me/api/records", data, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
      }
    }).success(function() {
        $scope.toggleForm();
        Notify.success("Your feedback has been received. Thank you!");
      }).error(function() {
        Notify.error("Something went wrong, would you like to try again? Sorry...");
      }).finally(function() {
        $submit.val("Send").prop("disabled", false);
      });
  };
});

mubook.controller("LoginCtrl", function LoginCtrl($scope, $http, $timeout, Global, PopupControl) {
  $scope.toggleForm = PopupControl.register("login", { scope: $scope });
  $scope.isVisible  = PopupControl.visibilityOf("login");
});


mubook.controller("UserCtrl",
function UserCtrl($scope, $timeout, $location, $routeParams, Global, visualizeGraph) {
  if (!$routeParams.username) {
    return;
  }
  visualizeGraph("/ajax/profile/" + $routeParams.username);
});

mubook.controller("SubjectAddCtrl",
function SubjectAddCtrl($scope, $timeout, $route, $cookies, $http, Global, PopupControl, Notify) {
  $scope.semesters = ["Semester 1", "Semester 2", "Summer", "Winter", "Other"];
  $scope.states = ["Studying", "Completed", "Planned", "Bookmarked"];

  var $year = $("#subjectAdderYear");
  var $semester = $("#subjectAdderSemester");
  var $state = $("#subjectAdderState");
  var $addBtn = $("#subjectAdderConfirmBtn");

  $scope.toggleAddForm = PopupControl.register("addSubject", {
    scope: $scope,
    onOpen: function() {
      $scope.resetForm();
    }
  });

  $scope.toggleDelForm = PopupControl.register("delSubject", {
    scope: $scope,
    onOpen: function() {
      $scope.delSubjCode = Global.selected;
    }
  });

  $scope.$on("userNodeSelected", function(event, value) {
    $scope.isSubjectNode = value;
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

  $scope.addSubject = function() {
    if (!$scope.isValidYear()) {
      return $year.focus();
    } else if (!$scope.isValidSemester()) {
      return $semester.focus();
    } else if (!$scope.isValidState()) {
      return $state.focus();
    }

    payload = {
      subject: Global.selected,
      year: $scope.modelYear,
      semester: $scope.modelSemester,
      state: $scope.modelState
    };

    $http.post("/profile/subjects/add", payload, {
      headers: { "X-CSRFToken": $cookies.csrftoken }
    }).then(function() {
      $route.reload();
      $scope.toggleAddForm();
      Notify.success("Added " + Global.selected);
    }, function(error) {
      Notify.error("Failed to add " + Global.selected);
    });
  };

  $scope.deleteSubject = function() {
    var url = "/profile/subjects/delete/" + Global.selected;
    $http.post(url, {}, {
      headers: { "X-CSRFToken": $cookies.csrftoken },
    }).then(function(message) {
      $route.reload();
      $scope.toggleDelForm(e);
      Notify.success("Deleted " + Global.selected);
    }, function(message) {
      Notify.error("Failed to delete " + Global.selected);
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

mubook.factory("UserSubject", function($http) {
  return function(code) {
    return $http.get("/ajax/my_subjects/" + code);
  };
});

mubook.factory("SubjectDetails", function($http) {
  return function(code) {
    return $http.get("/ajax/u-melbourne/" + code + "/details");
  };
});

mubook.filter("state", function() {
  return function(list, state) {
    return _.where(list, { state: state }).length;
  };
});

mubook.controller("SidePaneCtrl",
["$scope", "$rootScope", "$routeParams", "$sce", "PopupControl",
  "UserSubject", "GeneralStatistics", "SocialStatistics", "SubjectDetails",
function SidePaneCtrl($scope, $rootScope, $routeParams, $sce, PopupControl,
    UserSubject, GeneralStatistics, SocialStatistics, SubjectDetails) {
  var graphLoaded = function(event, nodes, successful, status) {
    if (successful && $routeParams.subjectCode) {
      updateSubjectInfo(event, $routeParams.subjectCode);
    } else if (successful && $routeParams.username) {
      userNode = nodes[nodes.length - 1];
      updateSubjectInfo(event, $routeParams.username, userNode, nodes.length);
    } else if (!successful && $routeParams.subjectCode) {
      $scope.name = "Oops!";
      $scope.code = "The subject does not exist.";
    } else if (!successful && $routeParams.username) {
      $scope.name = "Oops!";
      $scope.code = "The user does not exist.";
    }
  };

  var updateSubjectInfo = function(event, route, userNode, userSubjectsCount) {
    if (userNode) {
      $scope.name = userNode.name;
      if (userSubjectsCount == 1) {
        $scope.code = "Oops! You haven't added any subjects yet."
      } else {
        $scope.code = "";
      }
    }

    $rootScope.$broadcast("userNodeSelected", !userNode);
    $scope.isSubjectNode = !userNode;

    var subjectCode;
    if (angular.isString(route)) {
      subjectCode = route;
    } else if (route.params && route.params.subjectCode) {
      subjectCode = route.params.subjectCode;
    } else {
      subjectCode = $routeParams.subjectCode;
    }
    GeneralStatistics(subjectCode).success($scope.extend.bind($scope));
    SocialStatistics(subjectCode).success($scope.extend.bind($scope));
    UserSubject(subjectCode).success($scope.extend.bind($scope)).error(function() {
      $scope.status = $scope.year = $scope.semester = undefined;
    });
    SubjectDetails(subjectCode).success(function(subjectDetails) {
      $scope.extend(_.forOwn(_.pick(subjectDetails, [
        "code", "name", "credit", "commenceDate", "timeCommitment", "prereq",
        "assessment", "coreq", "overview", "objectives"
      ]), function(val, key, obj) {
        obj[key] = $sce.trustAsHtml(val);
      }));
    }).error(function() {
      $scope.extend(_.zipObject(
        [ "credit", "commenceDate", "timeCommitment", "prereq",
        "assessment", "coreq", "overview", "objectives" ],
        []
      ));
    });
  };

  $scope.name = "No Subject Selected";
  $scope.code = "Use the search to find a subject";

  var toggleFriendsList = PopupControl.register("friendsList", { scope: $scope });
  $scope.friendsListVisible = PopupControl.visibilityOf("friendsList");

  $scope.toggleFriendsList = function(state) {
    $scope.filteredFriends = _.where($scope.friends, { state: state });
    toggleFriendsList();
  };

  $scope.$on("graphDataLoaded", graphLoaded);
  $scope.$on("selectedSubjectChange", updateSubjectInfo);
}]);

mubook.factory("visualizeGraph", function ($rootScope, $http, $cookies, $window, $routeParams, Global) {
  var $sidePane    = $("#sidePane"),
      $topBar      = $("#topBar"),
      $searchInput = $("#searchInput"),
      SCALE_RANGE  = [0.4, 2],
      GRAPH_WIDTH  = $window.innerWidth - $sidePane.width(),
      GRAPH_HEIGHT = $window.innerHeight - $topBar.height();

  return function (url) {
    $http.get(url).success(function(data, status) {
      $rootScope.$broadcast("graphDataLoaded", data.nodes, true, status);

      $cookies.subjCode = Global.code;

      var graph = new Graph({
        name: "graphSVG", nodeData: data,
        width: GRAPH_WIDTH, height: GRAPH_HEIGHT
      });
      graph.makeGraph();
      graph.renderGraph();

      Global.selected = data.nodes[0].code || Global.code;

      graph.centerGraph(Global.reqType == "prereq");
      graph.addPanZoom(SCALE_RANGE);
      graph.nodes.on("click", function(d) {
        graph.onClickHandler(d, graph, this, { enableDelete: true });
      });
      graph.nodes.on("dblclick", graph.onDblClickHandler);
      makeRestoreButton().onclick = function (e) {
        if (graph.deletedNodeContainer.length != 0) {
          var curNode = graph.deletedNodeContainer.pop();
          graph.restoreNode(curNode);
          updateCorrespondingEdge(graph, curNode, RESTORE);
          if (graph.deletedNodeContainer.length == 0) {
            restoreBtn.style.display = "none";
          }
        }
      };

      if ($routeParams.subjectCode) {
        $searchInput.val(data.nodes[0].code + " - " + data.nodes[0].name);
      } else {
        $searchInput.val("");
      }
    }).error(function(data, status) {
      $rootScope.$broadcast("graphDataLoaded", data, false, status);
    });
  };
});
