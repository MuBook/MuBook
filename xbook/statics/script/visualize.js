(function legendInit() {
  var graphData = {
    nodes: [
      { id: 0, root: false, code: "Postrequisite of A" },
      { id: 1, root: true, code: "Subject A" },
      { id: 2, root: false, code: "Prerequisite of A" }
    ],
    links: [
      { source: 0, target: 1 },
      { source: 1, target: 2 }
    ]
  };

  // overriding d3 default rendering functions to avoid a bug occured when hiding legend
  function legendPostRender(graph, root) {
    if (graph.isDirected() && root.select('#legendArrowhead').empty()) {
      root
        .append('svg:defs')
        .append('svg:marker')
          .attr('id', 'legendArrowhead')
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 8)
          .attr('refY', 5)
          .attr('markerUnits', 'strokeWidth')
          .attr('markerWidth', 8)
          .attr('markerHeight', 5)
          .attr('orient', 'auto')
          .attr('style', 'fill: #333')
        .append('svg:path')
          .attr('d', 'M 0 0 L 10 5 L 0 10 z');
    }
  }

  function legendDrawEdgePaths(g, root) {
    var svgEdgePaths = root
      .selectAll('g.edgePath')
      .classed('enter', false)
      .data(g.edges(), function (e) { return e; });

    svgEdgePaths
      .enter()
      .append('g')
        .attr('class', 'edgePath enter')
      .append('path')
        .style('opacity', 0)
        .attr('marker-end', 'url(#legendArrowhead)');

    this._transition(svgEdgePaths.exit())
      .style('opacity', 0)
      .remove();

    return svgEdgePaths;
  }

  var graph = new Graph({
    nodeData: graphData,
    name: "graphLegendSVG",
    width: 150,
    height: 180,
    parentContainer: "#legendGraph",
    drawEdgePath: legendDrawEdgePaths,
    postRenderer: legendPostRender
  });

  graph.makeGraph();
  graph.renderGraph();
  graph.nodes.on("click", function(d) {
    graph.onClickHandler(d, graph, this, {});
  });
})();
