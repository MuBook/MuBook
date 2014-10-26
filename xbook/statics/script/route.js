mubook.config(["$routeProvider", "$locationProvider",
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);

    mubook.$routeProvider = $routeProvider
      .when("/profile/:username", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "UserCtrl"
      })
      .when("/:reqType/:university/:subjectCode", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "GraphCtrl"
      });
  }
]);

mubook.run(["$cookies", function($cookies) {
  mubook.$routeProvider.otherwise({
    redirectTo: "/prereq/melbourne/" + ($cookies.subjCode || "COMP30018")
  });
}]);
