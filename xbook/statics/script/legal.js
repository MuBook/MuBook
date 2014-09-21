var legal = angular.module("legal", []);

legal.run(["$window", "PopupControl", function($window, PopupControl) {
  $($window).on("keyup", function(event) {
    if (event.keyCode === 27) {
      PopupControl.closeOpened();
    }
  }).on("click", function() {
    PopupControl.closeOpened();
  });
}]);

legal.directive("popup", function() {
  return {
    restrict: "A",
    link: function(scope, elem, attr) {
      $(elem).on("click", function(event) { event.stopPropagation(); });
    }
  };
});

legal.factory("PopupControl", ["$timeout", function($timeout) {
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

legal.controller("UserCtrl", function UserCtrl($scope, $http, $location) {
  $scope.visualizeUserGraph = function(username) {
    $location.path("/profile/" + username);
  };
});

legal.controller("LoginCtrl", function LoginCtrl($scope, $http, $timeout, PopupControl) {
  $scope.toggleForm = PopupControl.register("login",
    { scope: $scope }
  );

  $scope.isVisible = PopupControl.visibilityOf("login");
});

legal.controller("FeedbackCtrl", function FeedbackCtrl($scope, $http, $timeout, PopupControl) {
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
