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

  var svg = d3.select("#graph")
    .append("svg")
      .attr("width", width)
      .attr("height", height);

  svg.append("svg:defs").selectAll("marker")
    .data(["suit", "licensing", "resolved"])
    .enter().append("svg:marker")
    .attr("id", String)
    .attr("viewBox", "0 -5 10 10")
    .attr("refX", refX)
    .attr("refY", refY)
    .attr("markerWidth", markerWidth)
    .attr("markerHeight", markerHeight)
    .attr("orient", "auto")
    .append("svg:path")
    .attr("d", "M0,-5L10,0L0,5");

  d3.json(url, function(error, graph) {
    if(error){
      console.log(error);
    }

    var n = graph.nodes.length;

    force
      .nodes(graph.nodes)
      .links(graph.links)

    graph.nodes.forEach(function(d, i) { d.x = d.y = width / n * i; });

    force.start();
    for (var i = n * ticks; i > 0; --i) force.tick();
    force.stop();

    var ox = 0, oy = 0;
    graph.nodes.forEach(function(d) { ox += d.x, oy += d.y; });
    ox = ox / n - width / 2, oy = oy / n - height / 2;
    graph.nodes.forEach(function(d) { d.x -= ox, d.y -= oy; });

    var path = svg.append("svg:g").selectAll("path")
        .data(force.links())
        .enter().append("svg:path")
        .attr("class", "link licensing")
        .attr("marker-end", "url(#licensing)");

    path.attr("d", function (d) {
        return "M" + d.source.x + "," + d.source.y
            + "L" + d.target.x + "," + d.target.y;
    });

    var node = svg.selectAll(".node")
      .data(graph.nodes)
      .enter().append("g")
      .attr("class", "node")
      .call(force.drag);

    var sc = document.querySelector("#selectedCode");
    var sn = document.querySelector("#selectedName");
    var sl = document.querySelector("#selectedLink");
    var ns = document.querySelectorAll(".node");

    node.on("click", function(d){
      sc.innerHTML = d.code;
      sn.innerHTML = d.name;
      sl.href = d.url;
      for (var i = ns.length - 1; i >=0; --i) {
        ns[i].classList.remove("selected");
      }
      this.classList.add("selected");
    });

    node.on("dblclick", function(d) {
      loadTree(d.code);
      document.getElementById("heading").
        getElementsByClassName("title")[0].innerHTML = d.code;
    });

    node.append("circle")
      .attr("r", function(d){
        return d.root ? 60 : 50;
      })
      .attr("style", function(d){
        return d.root ? "stroke: red" : "inherit";
      });

    node.append("text")
      .attr("dy", ".31em")
      .attr("text-anchor", "middle")
      .text(function(d) { return d.code; });

    var infoboxes = node.append("g")
      .attr("class", "info");

    infoboxes.append("text")
      .text(function(d){
        return d.name;
      })
      .attr("text-anchor", "middle")
      .attr("transform", "translate(0, 24)");

    node.attr("transform",
        function(d){ return "translate(" + d.x + ", " + d.y + ")"; });
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
