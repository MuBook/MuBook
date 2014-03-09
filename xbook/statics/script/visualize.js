var visualizeGraph = (function() {
  "use strict";

  var $sidePane = $("#sidePane"),
      $topBar = $("#topBar"),
      $searchInput = $("#searchInput");

  var WIDTH = window.innerWidth - $sidePane.width(),
      HEIGHT = window.innerHeight - $topBar.height(),
      SCALE_RANGE = [0.4, 2],
      DELETE = 0,
      RESTORE = 1;

  var selectedName = document.querySelector("#selectedName"),
      selectedCode = document.querySelector("#selectedCode");

  return function(url) {

    d3.json(url, function(error, graph) {

      if (error) {
        console.log(error);
      }

      var deletedNodeContainer = []
      var renderer = new dagreD3.Renderer();
      var g = new dagreD3.Digraph();
      var n = graph.nodes.length;
      var isPrereq = angular.element($("#typeSwitcher")).scope().prereq();
      var nodeData = null;

      for (var i = 0; i < n; ++i) {
          g.addNode(i, makeNode(graph.nodes[i]));
      }

      function makeNode(node) {
        return { label: node.code };
      }

      for (var i = 0; i < graph.links.length; ++i) {
        g.addEdge(null, graph.links[i].source, graph.links[i].target);
      }

      var layout = dagreD3.layout();
      renderer
        .layout(layout)
        .run(
          g,
          d3.select("#graph")
            .append("svg")
            .attr("id", "graphSVG")
            .attr("width", WIDTH)
            .attr("height", HEIGHT)
        );

      var nodes = d3.select(".nodes");
      var edges = d3.select(".edgePaths");
      var svg = d3.select("#graphSVG");

      var node = svg.selectAll(".node")
        .data(graph.nodes);
      var rect = svg.selectAll(".node rect")
        .data(graph.nodes);
      var edge = svg.selectAll(".edgePath")
        .data(graph.links);

      var centerNodeTranslation = CenterGraphOn(node);

      svg.call(
        d3.behavior.zoom()
          .translate(centerNodeTranslation)
          .scaleExtent(SCALE_RANGE)
          .on("zoom", zoomScale)
      );

      var ns = document.querySelectorAll(".node");
      var prevHighlightNode = "";

      resetOpacity();
      makeRestoreButton();

      showSubjectDetails(graph.nodes[0], selectedName, selectedCode);
      $searchInput.val(graph.nodes[0].code + " - " + graph.nodes[0].name);

      restoreBtn.onclick = function(e) {
        if (deletedNodeContainer.length != 0) {
          var curNode = deletedNodeContainer.pop();
          restoreNode(graph, node, curNode);
          updateCorrespondingEdge(graph, deletedNodeContainer, curNode, RESTORE);
          if (deletedNodeContainer.length == 0) {
            restoreBtn.style.display = "none";
          }
        }
      }

      node.on("click", function(d) {
        if (d3.event.button === 0 && d3.event.ctrlKey) {
          document.querySelector("#restoreBtn").style.display = "inline";
          this.classList.add("deleted");
          updateCorrespondingEdge(graph, deletedNodeContainer, d.code, DELETE);
          resetOpacity();
          return;
        }

        for (var i = ns.length - 1; i >=0; --i) {
          ns[i].classList.remove("selected");
          ns[i].classList.remove("visible");
        }
        this.classList.add("selected");

        for (var i = 0; i < edge[0].length; ++i) {
          edge[0][i].style.opacity = 0.2;
        }

        if (d.code != prevHighlightNode) {
          deleteNode(graph, d, d.code);
          showSubjectDetails(d, selectedName, selectedCode);
        } else {
          prevHighlightNode = "";
          resetOpacity();
        }
      });

      node.on("dblclick", function(d) {
        var $graph = angular.element($("#graphContainer")).scope();
        $graph.replacePath(d.code);
        $graph.$apply();
      });

      rect
        .attr("style", function(d) {
          return d.root ? "stroke: red" : "inherit";
        });

      var buttonText = d3
        .selectAll(".node text")
        .attr("class", "button-text")
        .attr("text-anchor", "center");

      var infoboxes = node.append("text")
        .attr("class", "info")
        .text(function(d) {
          return d.name;
        })
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, 34)");

      function zoomScale() {
        nodes.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
        edges.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
      }

      function resetOpacity() {
        for (var i = 0; i < edge[0].length; ++i) {
            edge[0][i].style.opacity = 1;
        }
        for (var i = ns.length - 1; i >=0; --i) {
          ns[i].classList.add("visible");
        }
      }

      function showSubjectDetails(d, selectedName, selectedCode) {
        var detailsContainer = document.querySelectorAll(".subjectDetail");

        selectedName.innerHTML = d.name;
        selectedCode.innerHTML = d.code;
        detailsContainer[0].innerHTML = d.credit || "None";
        detailsContainer[1].innerHTML = d.commence_date || "None";
        detailsContainer[2].innerHTML = d.time_commitment || "None";
        detailsContainer[3].innerHTML = d.prereq || "None";
        detailsContainer[4].innerHTML = d.assessment || "None";
        detailsContainer[5].innerHTML = d.coreq || "None";
        detailsContainer[6].innerHTML = d.overview || "None";
        detailsContainer[7].innerHTML = d.objectives || "None";

        for (var i = 0; i < detailsContainer.length - 1; ++i) {
          detailsContainer[i].parentNode.classList.remove("hidden");
          if (detailsContainer[i].innerHTML.search("None") >= 0) {
            detailsContainer[i].parentNode.classList.add("hidden");
          }
        }
      }

      function restoreNode(graph, node, subjectCode) {
        for (var i = 0; i < graph.nodes.length; ++i) {
          if (graph.nodes[i].code === subjectCode) {
            node[0][i].classList.remove("deleted");
          }
        }
      }

      function updateCorrespondingEdge(graph, nodeContainer, subjectCode, operation) {
        var position = nodeIndex(graph, subjectCode);

        for (var i = 0; i < graph.links.length; ++i) {
          var source = graph.links[i].source,
              target = graph.links[i].target;
          if (position === source || position === target) {
            switch (operation) {
              case DELETE:
                edge[0][i].style.display = "none";
                break;
              case RESTORE:
                if (nodeContainer.indexOf(graph.nodes[source].code) === -1
                  && nodeContainer.indexOf(graph.nodes[target].code) === -1) {
                  edge[0][i].style.display = "inline";
                }
              }
          }
        }

        if (operation === DELETE) {
          deletedNodeContainer.push(subjectCode);
        } else {
          var nodePosition = deletedNodeContainer.indexOf(subjectCode);
          deletedNodeContainer.slice(nodePosition, nodePosition + 1);
        }
      }

      function nodeIndex(graph, subjectCode) {
        for (var i = 0; i < graph.nodes.length; ++i) {
          if (subjectCode === graph.nodes[i].code) {
            return i;
          }
        }
        return -1;
      }

      function makeRestoreButton() {
        var graphContainer = document.querySelector("#graph");
        var restoreBtn = document.createElement("button");
        restoreBtn.classList.add("btn");
        restoreBtn.id = "restoreBtn";
        restoreBtn.innerHTML = "Restore Node";
        restoreBtn.style.display = "none";
        graphContainer.appendChild(restoreBtn);
      }

      function deleteNode(graph, d, subjectCode) {
        prevHighlightNode = subjectCode;
        var nodeQueue = new SetQueue();
        var rootPosition = 0;
        for (var i = 0; i < graph.nodes.length; ++i) {
          if (graph.nodes[i].code === subjectCode) {
            rootPosition = i;
            break;
          }
        }
        nodeQueue.push(rootPosition);
        var currentRoot, queueHead = 0;
        while (queueHead != nodeQueue.length()) {
          currentRoot = nodeQueue.get(queueHead++);
          if (deletedNodeContainer.indexOf(graph.nodes[currentRoot].code) === -1) {
            node[0][currentRoot].classList.add("visible");
            for (var i = 0; i < graph.links.length; ++i) {
              if (graph.links[i].source == currentRoot) {
                edge[0][i].style.opacity = 1;
                nodeQueue.push(graph.links[i].target);
              }
            }
          }
        }
      }

      function CenterGraphOn(node) {
        var x = node[0][0].getBoundingClientRect().left,
            y = node[0][0].getBoundingClientRect().bottom;
        var centerNodeTranslation = [isPrereq ? (-x + 240) + WIDTH / 2
                                    : (-x + 240) + WIDTH / 2,
                                    isPrereq ? HEIGHT / 4 : -y + HEIGHT / 2];
        nodes.attr("transform", "translate(" + centerNodeTranslation + ")");
        edges.attr("transform", "translate(" + centerNodeTranslation + ")");
        return centerNodeTranslation;
      }

    });
  };
})();

function visualizeGraphHelper() {
  /*
  overriding d3 default rendering functions to avoid a bug occured when
  hiding legend.
  */
  var legendDrawEdgePaths = function(g, root) {
    var svgEdgePaths = root
      .selectAll('g.edgePath')
      .classed('enter', false)
      .data(g.edges(), function(e) { return e; });

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
  };

  function legendPostRender(graph, root) {
  if (graph.isDirected() && root.select('#legendArrowhead').empty()) {
    root
      .append('svg:defs')
        .append('svg:marker')
          .attr('id', 'legendArrowhead')
          .attr('viewBox', '0 0 10 10')
          .attr('refX', 8)
          .attr('refY', 5)
          .attr('markerUnits', 'strokewidth')
          .attr('markerWidth', 8)
          .attr('markerHeight', 5)
          .attr('orient', 'auto')
          .attr('style', 'fill: #333')
          .append('svg:path')
            .attr('d', 'M 0 0 L 10 5 L 0 10 z');
  }
}

  var nodeData = [{id: 0, root: false},
                  {id: 1, root: true},
                  {id: 2, root: false}];
  var renderer = new dagreD3.Renderer();
  renderer.drawEdgePaths(legendDrawEdgePaths);
  renderer.postRender(legendPostRender);
  var g = new dagreD3.Digraph();
  g.addNode(nodeData[0].id, {label: "Prerequisite of A"});
  g.addNode(nodeData[1].id, {label: "Subject A"});
  g.addNode(nodeData[2].id, {label: "Postrequisite of A"});
  g.addEdge(null, 1, 0);
  g.addEdge(null, 2, 1);

  var layout = dagreD3.layout();
  renderer
    .layout(layout)
    .run(
      g,
      d3.select("#legendGraph")
        .append("svg")
        .attr("id", "graphLegendSVG")
        .attr("width", 134)
        .attr("height", 193)
    );
  var svg = d3.select("#graphLegendSVG");
  var nodes = svg.selectAll(".node")
                 .data(nodeData),
      rect =  svg.selectAll(".node rect")
                 .data(nodeData);
  rect.attr("style", function(d) {
      return d.root ? "stroke: red" : "inherit";
  });
  nodes.on("click", function(d) {
    for (var i = 0; i < nodes[0].length; ++i) {
      nodes[0][i].classList.remove("selected");
    }
    this.classList.add("selected");
  });
}

/* A queue that has only unique items */
function SetQueue() {
  this._container = [];
}

SetQueue.prototype = {
  push : function(item) {
    if (this._container.indexOf(item) < 0) {
      this._container.push(item);
    }
  },

  get : function(index) {
    return this._container[index];
  },

  length : function() {
    return this._container.length;
  }
}
