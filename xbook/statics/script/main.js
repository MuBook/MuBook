/**
 * Index General Control
 * - Init
 * - Event
 * - etc.
 */
var graph = document.getElementById("graph");
var inp = document.getElementById("searchInput");
var heading = document.getElementById("heading");
var search = document.getElementById("searchScreen");

function loadTree(url){
  graph.innerHTML = "";
  url = url || "ajax/u-123/subject/comp30018";
  visualizeGraph(url);
}

loadTree();

/**
 * Subject Searching App
 * - subject picker/filter
 */
var myApp = angular.module('SubjectGraph', []);

myApp.factory('Subjects', function($http){
  return $http.jsonp("http://127.0.0.1:8000/ajax/u-123/subjectlist?callback=JSON_CALLBACK");
});

myApp.factory('GlobalCV', function(){
  return {
    code: 'comp30018',
    isSearching: false
  };
});

function SearchCtrl($scope, Subjects, GlobalCV){
  $scope.replacePath = function replacePath(code){
    loadTree("ajax/u-123/subject/" + code);
    GlobalCV.isSearching = false;
    GlobalCV.code = code;
  };

  $scope.isVisiable = function isVisiable(){
    return GlobalCV.isSearching;
  };

  $scope.esc = function esc(e){
    if (e.keyCode == 27) {
      e.preventDefault();
      GlobalCV.isSearching = false;
    } else if (e.keyCode == 13) {
      var s = document.querySelector("tr:first-child").children[0].innerHTML;
      $scope.replacePath(s);
    }
  };

  $scope.subjects = [{"code": "Nahh", "name": "waiting for data"}];
  Subjects.success(function(data){
    $scope.subjects = data.subjList;
  }).error(function(a, b, c, d){
    console.log(a);
    console.log(b);
    console.log(c);
    console.log(d);
  });
}

function UICtrl($scope, $timeout, GlobalCV){
  $scope.getCode = function code(){
    return GlobalCV.code;
  };
  $scope.search = function search(){
    GlobalCV.isSearching = true;
    $timeout(function(){
      inp.focus();
    });
  };
}
