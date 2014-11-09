mubook.config(["$routeProvider", "$locationProvider",
  function($routeProvider, $locationProvider) {
    $locationProvider.html5Mode({ enabled: true, requireBase: false });

    mubook.$routeProvider = $routeProvider
      .when("/profile/:username", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "UserCtrl"
      })
      .when("/explorer/:reqType/:university/:subjectCode", {
        title: " - µBook",
        templateUrl: "/template",
        controller: "GraphCtrl"
      });
  }
]);

mubook.run(["$cookies", function($cookies) {
  mubook.$routeProvider.otherwise({
    redirectTo: "/explorer/prereq/melbourne/" + ($cookies.subjCode || "COMP30018")
  });
}]);
