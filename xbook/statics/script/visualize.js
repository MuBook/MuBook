"use strict";

function visualizeGraph(url){
  var width = 1200,
      height = 1000;

  var makeNode = function(node) {
    node["label"] = node["code"];
    return node;
  }

  d3.json(url, function(error, graph) {
    if(error){
      console.log(error);
    }

    var g = new dagreD3.Digraph();
    var n = graph.nodes.length;
    var $reqType = angular.element($("#sidePane")).scope().reqType();

    for(var i = 0; i < n; ++i) {
      g.addNode(i, makeNode(graph.nodes[i]));
    }

    for(var i = 0; i < graph.links.length; ++i) {
      g.addEdge(null, graph.links[i].source, graph.links[i].target);
    }

    var layout = dagreD3.layout();
    var renderer = new dagreD3.Renderer();
    renderer.layout(layout).run(g, d3.select("#graph").append("svg").attr("width", width).attr("height", height).attr("id", "graphSVG"));

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
      $reqType === "prereq" ? (-yMinX + 240) + width / 2 : (-yMaxX + 240) + width / 2,
      $reqType === "prereq" ? height / 4 : 0
    ];

    nodes.attr("transform", "translate(" + centerNodeTranslation + ")");
    edges.attr("transform", "translate(" + centerNodeTranslation + ")");

    svg.call(d3.behavior.zoom()
      .translate(centerNodeTranslation)
      .scaleExtent([0.0001, 1])
      .on("zoom", zoomScale));


    var sn = document.querySelector("#selectedName");
    var sl = document.querySelector("#selectedLink");
    var ns = document.querySelectorAll(".node");
    var sd = document.getElementsByClassName("subjectDetail");
    
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
}

function visualizeTree(url){
  d3.json(url, function(error, data){
    console.log(error);
    var tree = d3.layout.tree()
      .size([1200, 800])
      .separation(
        function(a, b){ return (a.parent == b.parent ? 100 : 120); }
      );

    var diagonal = d3.svg.diagonal();

    var svg = d3.select("#graph").append("div")
      .classed("center", 1)
      .style({"width": "1200px"})
      .append("svg")
        .attr("width", 1200)
        .attr("height", 1000);

    svg.append("rect")
      .attr("width", 1200)
      .attr("height", 1000)
      .classed("background", 1);

    svg = svg.append("g").attr("transform", "translate(0, 100)");

    (function(root){
      var nodes = tree.nodes(root),
          links = tree.links(nodes);

      var link = svg.selectAll(".link")
          .data(links)
        .enter().append("path")
          .attr("class", "link")
          .attr("d", diagonal);

      var node = svg.selectAll(".node")
          .data(nodes)
        .enter().append("g")
          .attr("class", "node")
          .attr("transform",
            function(d){ return "translate(" + d.x + ", " + d.y + ")"; });

      node.append("circle")
        .attr("r", 50);

      node.append("text")
        .attr("dy", ".31em")
        .attr("text-anchor", "middle")
        .text(function(d) { return d.name; });

    })(data);
  });
}
