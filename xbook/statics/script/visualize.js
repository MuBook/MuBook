"use strict";

function visualizeGraph(url){
  var width = 1200,
      height = 1000,
      ticks = 1000,
      markerWidth = 6,
      markerHeight = 6,
      cRadius = 50,
      refX = cRadius + (markerWidth * 2.5),
      refY = 0,
      drSub = cRadius + refY;

  var force = d3.layout.force()
    .charge(-2400)
    .linkDistance(150)
    .size([width / 2, height / 2]);
  // var force = dagre.layout()
  //   .nodeSep(20)
  //   .rankDir("LR");

  // var svg = d3.select("#graph")
  //   .append("svg")
  //     .attr("width", width)
  //     .attr("height", height);

  // svg.append("svg:defs").selectAll("marker")
  //   .data(["suit", "licensing", "resolved"])
  //   .enter().append("svg:marker")
  //   .attr("id", String)
  //   .attr("viewBox", "0 -5 10 10")
  //   .attr("refX", refX)
  //   .attr("refY", refY)
  //   .attr("markerWidth", markerWidth)
  //   .attr("markerHeight", markerHeight)
  //   .attr("orient", "auto")
  //   .append("svg:path")
  //   .attr("d", "M0,-5L10,0L0,5");

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

    force
      .nodes(graph.nodes)
      .links(graph.links);

    for(var i = 0; i < n; ++i) {
      g.addNode(i, makeNode(graph.nodes[i]));
    }

    for(var i = 0; i < graph.links.length; ++i) {
      g.addEdge(null, graph.links[i].source, graph.links[i].target);
    }

    // graph.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

    // force.start();
    // for (var i = n * ticks; i > 0; --i) force.tick();
    // force.stop();

    // var ox = 0, oy = 0;
    // graph.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
    // ox = ox / n - width / 2, oy = oy / n - height / 2;
    // graph.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });



    // var path = svg.append("svg:g").selectAll("path")
    //     .data(force.links())
    //     .enter().append("svg:path")
    //     .attr("class", "link licensing")
    //     .attr("marker-end", "url(#licensing)");

    // path.attr("d", function (d) {
    //     return "M" + d.source.x + "," + d.source.y
    //         + "L" + d.target.x + "," + d.target.y;
    // });

    var layout = dagreD3.layout().run(g);
    var renderer = new dagreD3.Renderer();
    renderer.run(g, d3.select("#graph").append("svg").attr("width", width).attr("height", height).attr("id", "graphSVG"));

    var nodes = d3.select(".nodes");
    var edges = d3.select(".edgePaths");
    var svg = d3.select("#graphSVG");

    // var node = svg.selectAll(".node enter")
    //   .data(graph.nodes)
    //   .enter().append("g")
    //   .attr("class", "node")
    //   .call(force.drag);

    var node = svg.selectAll(".node")
      .data(graph.nodes);
    var rect = svg.selectAll(".node rect")
      .data(graph.nodes);

    /* Center graph */
    console.log(node[0][0].getBoundingClientRect());
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
      console.log(yMinX);
    }
    var centerNodeTranslation = [
      $reqType === "prereq" ? (-yMinX + 240) + width / 2 : (-yMaxX + 240) + width / 2,
      $reqType === "prereq" ? height / 4 : 0
    ];
    console.log(centerNodeTranslation);
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
      for (var i = 0; i < sd.length; ++i) {
        sd[i].style.display = "block";
      }
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

    // node.append("text")
    //   .attr("dy", ".31em")
    //   .attr("text-anchor", "middle")
    //   .text(function(d) { return d.code; });

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

    // node.attr("transform",
    //     function(d){ return "translate(" + d.x + ", " + d.y + ")"; });

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
