var visualizeGraph = (function() {
  "use strict";

  var $sidePane = $("#sidePane");

  var WIDTH = window.innerWidth - $sidePane.width(),
      HEIGHT = window.innerHeight,
      SCALE_RANGE = [0.2, 2];

  var renderer = new dagreD3.Renderer();

  var makeNode = function(node) {
    node.label = node.code;
    return node;
  }

  return function(url) {

    d3.json(url, function(error, graph) {
      if(error){
        console.log(error);
      }

      var g = new dagreD3.Digraph();
      var n = graph.nodes.length;
      var $reqType = angular.element($sidePane).scope().reqType();

      for(var i = 0; i < n; ++i) {
        g.addNode(i, makeNode(graph.nodes[i]));
      }

      for(var i = 0; i < graph.links.length; ++i) {
        g.addEdge(null, graph.links[i].source, graph.links[i].target);
      }

      var layout = dagreD3.layout();
      renderer
        .layout(layout)
        .run(
          g,
          d3.select("#graph")
            .append("svg")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
            .attr("id", "graphSVG")
        );

      var nodes = d3.select(".nodes");
      var edges = d3.select(".edgePaths");
      var svg = d3.select("#graphSVG");

      var node = svg.selectAll(".node")
        .data(graph.nodes);
      var rect = svg.selectAll(".node rect")
        .data(graph.nodes);

      /* Center graph */
      var yMin = node[0][0].getBoundingClientRect().bottom,
          yMinX = node[0][0].getBoundingClientRect().left,
          yMax = node[0][0].getBoundingClientRect().bottom,
          yMaxX = node[0][0].getBoundingClientRect().left;
      for(var i = 0; i < node[0].length; ++i) {
        if(node[0][i].getBoundingClientRect().bottom < yMin) {
          yMin = node[0][i].getBoundingClientRect().bottom;
          yMinX = node[0][i].getBoundingClientRect().left;
        }
        if(node[0][i].getBoundingClientRect().bottom > yMax) {
          yMax = node[0][i].getBoundingClientRect().bottom;
          yMaxX = node[0][i].getBoundingClientRect().left;
        }
      }

      var centerNodeTranslation = [
        $reqType === "prereq" ? (-yMinX + 240) + WIDTH / 2 : (-yMaxX + 240) + WIDTH / 2,
        $reqType === "prereq" ? HEIGHT / 4 : 0
      ];

      nodes.attr("transform", "translate(" + centerNodeTranslation + ")");
      edges.attr("transform", "translate(" + centerNodeTranslation + ")");

      svg.call(
        d3.behavior.zoom()
          .translate(centerNodeTranslation)
          .scaleExtent(SCALE_RANGE)
          .on("zoom", zoomScale)
      );

      var sn = document.querySelector("#selectedName");
      var sl = document.querySelector("#selectedLink");
      var ns = document.querySelectorAll(".node");
      var sd = document.querySelectorAll(".subjectDetail");

      node.on("click", function(d){
        sn.innerHTML = d.name;
        sl.href = d.url;
        for (var i = ns.length - 1; i >=0; --i) {
          ns[i].classList.remove("selected");
        }
        this.classList.add("selected");
      });

      node.on("dblclick", function(d) {
        var $graph = angular.element($("#graphContainer")).scope();
        $graph.update(d.code);
        $graph.$apply();
      });

      rect
        .attr("style", function(d){
          return d.root ? "stroke: red" : "inherit";
        });

      var infoboxes = node.append("g")
        .attr("class", "info");

      infoboxes.append("text")
        .text(function(d){
          return d.name;
        })
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, 24)");

      function zoomScale() {
        nodes.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        edges.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }
    });
  };

})();

