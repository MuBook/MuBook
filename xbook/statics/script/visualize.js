var visualizeGraph = (function() {
  "use strict";

  var $sidePane = $("#sidePane");

  var TOP_BAR_HEIGHT = 42;
  var WIDTH = window.innerWidth - $sidePane.width(),
      HEIGHT = window.innerHeight - TOP_BAR_HEIGHT,
      SCALE_RANGE = [0.4, 2],
      DELETE = 0,
      RESTORE = 1;

  var selectedName = document.querySelector("#selectedName");
  var selectedCode = document.querySelector("#selectedCode");

  return function(url) {

    d3.json(url, function(error, graph) {
      if (error) {
        console.log(error);
      }

      var deletedNodeContainer = []
      var renderer = new dagreD3.Renderer();
      var g = new dagreD3.Digraph();
      var n = graph.nodes.length;
      var $reqType = angular.element($sidePane).scope().reqType();
      var nodeData = null;
      makeDetailsButton($sidePane);

      for (var i = 0; i < n; ++i) {
          g.addNode(i, makeNode(graph.nodes[i]));
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
            .attr("position", "fixed")
            .attr("bottom", "0")
            .attr("right", "0")
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
      /* Center graph */
      var yMin = node[0][0].getBoundingClientRect().bottom,
          yMinX = node[0][0].getBoundingClientRect().left,
          yMax = node[0][0].getBoundingClientRect().bottom,
          yMaxX = node[0][0].getBoundingClientRect().left;

      for (var i = 0; i < node[0].length; ++i) {
        if (node[0][i].getBoundingClientRect().bottom < yMin) {
          yMin = node[0][i].getBoundingClientRect().bottom;
          yMinX = node[0][i].getBoundingClientRect().left;
        }
        if (node[0][i].getBoundingClientRect().bottom > yMax) {
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

      var ns = document.querySelectorAll(".node");
      var readMore = document.getElementById("readMore");
      var prevHighlightNode = "";

      resetOpacity();
      makeRestoreButton();

      showSubjectDetail(graph.nodes[0], readMore, selectedName, selectedCode);
      angular.element($sidePane).scope().update(graph.nodes[0].code);

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
          document.getElementById("restoreBtn").style.display = "inline";
          this.classList.add("deleted");
          updateCorrespondingEdge(graph, deletedNodeContainer, d.code, DELETE);
          return;
        }

        for (var i = ns.length - 1; i >=0; --i) {
          ns[i].classList.remove("selected");
          ns[i].classList.remove("visible")
        }
        this.classList.add("selected");

        for (var i = 0; i < edge[0].length; ++i) {
          edge[0][i].style.opacity = 0.2;
        }

        if (d.code != prevHighlightNode) {
          prevHighlightNode = d.code;
          var path = [];
          var nodeQueue = new SetQueue();
          var rootPosition = 0;
          for (var i = 0; i < graph.nodes.length; ++i) {
            if (graph.nodes[i].code === d.code) {
              rootPosition = i;
              break;
            }
          }
          nodeQueue.push(rootPosition);
          var currentRoot, queueHead = 0;
          while (queueHead != nodeQueue.length()) {
            currentRoot = nodeQueue.get(queueHead);
            node[0][currentRoot].classList.add("visible");
            for (var i = 0; i < graph.links.length; ++i) {
              if (graph.links[i].source == currentRoot) {
                edge[0][i].style.opacity = 1;
                nodeQueue.push(graph.links[i].target);
              }
            }
            queueHead++;
          }
          readMore.classList.remove("hidden");
          showSubjectDetail(d, readMore, selectedName, selectedCode);
        } else {
          prevHighlightNode = "";
          resetOpacity();
        }
      });

      node.on("dblclick", function(d) {
        var $graph = angular.element($("#graphContainer")).scope();
        $graph.update(d.code);
        $graph.$apply();
      });

      rect
        .attr("style", function(d) {
          return d.root ? "stroke: red" : "inherit";
        });

      var infoboxes = node.append("g")
        .attr("class", "info");

      infoboxes.append("text")
        .text(function(d) {
          return d.name;
        })
        .attr("text-anchor", "middle")
        .attr("transform", "translate(0, 24)");

      function makeNode(node) {
        node.label = node.code;
        return node;
      }

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

      function showSubjectDetail(d, readMore, selectedName, selectedCode) {
        var detailsContainer = [];

        detailsContainer.push(document.querySelector("#creditPointDetail"));
        detailsContainer.push(document.querySelector("#semesterDetail"));
        detailsContainer.push(document.querySelector("#timeCommitDetail"));
        detailsContainer.push(document.querySelector("#prerequisitesDetail"));
        detailsContainer.push(document.querySelector("#corequisitesDetail"));
        detailsContainer.push(document.querySelector("#assessmentsDetail"));
        detailsContainer.push(document.querySelector("#subjectOverviewDetail"));
        detailsContainer.push(document.querySelector("#objectivesDetail"));

        selectedName.innerHTML = d.name;
        selectedCode.innerHTML = d.code;
        detailsContainer[0].innerHTML = d.credit ? d.credit : "None";
        detailsContainer[1].innerHTML = d.commence_date ? d.commence_date : "None";
        detailsContainer[2].innerHTML = d.time_commitment ? d.time_commitment : "None";
        detailsContainer[3].innerHTML = d.prereq ? d.prereq : "None";
        detailsContainer[4].innerHTML = d.coreq ? d.coreq : "None";
        detailsContainer[5].innerHTML = d.assessment ? d.assessment : "None";
        detailsContainer[6].innerHTML = d.overview ? d.overview.slice(0, 100) + "..." : "None";
        detailsContainer[7].parentNode.classList.add("hidden");

        for (var i = 0; i < detailsContainer.length - 1; ++i) {
          detailsContainer[i].parentNode.classList.remove("hidden");
          console.log(detailsContainer[i].innerHTML.search("None"));
          if (detailsContainer[i].innerHTML.search("None") >= 0) {
            detailsContainer[i].parentNode.classList.add("hidden");
          }
        }

        readMore.onclick = function(e) {
          detailsContainer[6].innerHTML = d.overview ? d.overview : "None";
          detailsContainer[7].parentNode.classList.remove("hidden");
          detailsContainer[7].innerHTML = d.objectives ? d.objectives : "None";
          readMore.classList.add("hidden");
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
      }

      function makeRestoreButton() {
        var graphContainer = document.getElementById("graph");
        var restoreBtn = document.createElement("button");
        restoreBtn.classList.add("btn");
        restoreBtn.id = "restoreBtn";
        restoreBtn.innerHTML = "Restore Node";
        restoreBtn.style.display = "none";
        graphContainer.appendChild(restoreBtn);
      }

      function makeDetailsButton(sidePane) {
        var readMore = document.createElement("a");
        readMore.id = "readMore";
        readMore.innerHTML = "[show details]";
        sidePane.append(readMore);
      }

    });
  };
})();

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
