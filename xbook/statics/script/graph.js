var DELETE  = 0,
    RESTORE = 1;

function Graph(config) {
  config = config || {};

  this.deletedNodeContainer = [];
  this.prevHighlightNode = "";
  this.renderer = new dagreD3.Renderer();
  this.layout = dagreD3.layout();
  this.g = new dagreD3.Digraph();
  this.selectedName = document.querySelector("#selectedName");
  this.selectedCode = document.querySelector("#selectedCode");
  this.parentContainer = "#graph";

  for (var key in config) {
    this[key] = config[key];
  }

  this._id = "#" + this.name;

  if (this.drawEdgePath) {
    this.renderer.drawEdgePaths(this.drawEdgePath);
  }

  if (this.postRenderer) {
    this.renderer.postRender(this.postRenderer);
  }
}

Graph.prototype._makeNode = function(node) { return { label: node.code || node.id }; };

Graph.prototype.makeGraph = function() {
  for (var i = 0; i < this.nodeData.nodes.length; ++i) {
    this.g.addNode(i, this._makeNode(this.nodeData.nodes[i]));
  }

  for (var i = 0; i < this.nodeData.links.length; ++i) {
    this.g.addEdge(null, this.nodeData.links[i].source, this.nodeData.links[i].target);
  }
};

Graph.prototype.renderGraph = function(config) {
  config = config || {};
  this.renderer
    .layout(this.layout)
    .run(
      this.g,
      d3.select(this.parentContainer)
        .append("svg")
          .attr("id", this.name)
          .attr("width", this.width)
          .attr("height", this.height)
    );
  this.svg = d3.select("#" + this.name);
  this.nodes = this.svg.selectAll(".node")
    .data(this.nodeData.nodes);
  this.rects = this.svg.selectAll(".node rect")
    .data(this.nodeData.nodes);
  this.edges = this.svg.selectAll(".edgePath")
    .data(this.nodeData.links);
  this.node = d3.select(this._id + " .nodes");
  this.edge = d3.select(this._id + " .edgePaths");

  this.setStyle({ resetOpacity: true, highlightRoot: true });

  d3.selectAll(this._id + " .node text")
    .attr("class", "button-text")
    .attr("text-anchor", "center");

  this.nodes.append("text")
    .attr("class", "info")
    .text(function(d) {
      return d.name;
    })
    .attr("text-anchor", "middle")
    .attr("transform", "translate(0, 34)");
};

Graph.prototype.centerGraph = function(isPrereq) {
  var x = this.nodes[0][0].getBoundingClientRect().left,
      y = this.nodes[0][0].getBoundingClientRect().bottom;
  var centerNodeTranslation = [
    isPrereq ? (-x + 240) + this.width / 2 : (-x + 240) + this.width / 2,
    isPrereq ? this.height / 4 : -y + this.height / 2
  ];
  this.node.attr("transform", "translate(" + centerNodeTranslation + ")");
  this.edge.attr("transform", "translate(" + centerNodeTranslation + ")");
  this.centerPosition = centerNodeTranslation;
};

Graph.prototype.setStyle = function(config) {
  config = config || {};

  var edges = this.edges[0],
      nodes = this.nodes[0];

  if (config.resetOpacity) {
    edges.map(function(edge) { edge.style.opacity = 1; });
    nodes.map(function(node) { node.classList.add("visible"); });
  } else if (config.dimOpacity) {
    edges.map(function(edge) { edge.style.opacity = 0.2; });
    nodes.map(function(node) { node.classList.remove("visible"); });
  }

  if (config.removeSelected) {
    nodes.map(function(node) { node.classList.remove("selected"); });
  }

  if (config.highlightRoot) {
    this.rects
      .attr("style", function(d) {
        return d.root ? "stroke: red" : "inherit";
      });
  }
};

Graph.prototype.addPanZoom = function(scaleRange) {
  var graph = this;
  this.svg.call(
    d3.behavior.zoom()
      .translate(this.centerPosition)
      .scaleExtent([0.4, 2])
      .on("zoom", function() { zoomScale(graph.node, graph.edge); })
    );
};

Graph.prototype.deleteNode = function(subjectCode, node) {
  document.querySelector("#restoreBtn").style.display = "inline";
  node.classList.add("deleted");
  updateCorrespondingEdge(this, subjectCode, DELETE);
  this.setStyle({ resetOpacity: true, removeSelected: true });
};

Graph.prototype.restoreNode = function(subjectCode) {
  var index = _(this.nodeData.nodes).findIndex({ code: subjectCode });
  this.nodes[0][index].classList.remove("deleted");
  this.setStyle({ resetOpacity: true, removeSelected: true });
};

Graph.prototype.highlightSubtree = function(subjectCode) {
  var nodeQueue    = new SetQueue(),
      rootPosition = _(this.nodeData.nodes).findIndex({ code: subjectCode });

  nodeQueue.push(rootPosition);

  var currentRoot,
      queueHead = 0,
      edges     = this.edges[0],
      nodes     = this.nodes[0];
  while (queueHead !== nodeQueue.length()) {
    currentRoot = nodeQueue.get(queueHead++);
    if (this.deletedNodeContainer.indexOf(this.nodeData.nodes[currentRoot].code) >= 0) {
      continue;
    }
    nodes[currentRoot].classList.add("visible");
    for (var i = 0; i < this.nodeData.links.length; ++i) {
      if (this.nodeData.links[i].source == currentRoot) {
        edges[i].style.opacity = 1;
        nodeQueue.push(this.nodeData.links[i].target);
      }
    }
  }
};

Graph.prototype.onClickHandler = function(nodeData, graph, clickedNode, config) {
  config = config || {}
  if (config.enableDelete && d3.event.button === 0 && d3.event.shiftKey) {
    graph.deleteNode(nodeData.code, clickedNode);
    return;
  }

  graph.setStyle({ dimOpacity: true, removeSelected: true });

  if (nodeData.code != graph.prevHighlightNode) {
    $rootScope.setSelected(nodeData.isUserNode ? "user" : "subject", nodeData.code);

    if (!config.isLegendNode) {
      $rootScope.$broadcast(
        "selectedSubjectChange",
        nodeData.code,
        nodeData.isUserNode ? nodeData : null
      );
    }

    graph.highlightSubtree(nodeData.code);
    clickedNode.classList.add("selected");
    graph.prevHighlightNode = nodeData.code;
  } else {
    $rootScope.setSelected();

    if (!config.isLegendNode) {
      rootNode = $rootScope.getSelected();
      $rootScope.$broadcast(
        "selectedSubjectChange",
        rootNode.code,
        rootNode.type == "user"
      );
    }

    clickedNode.classList.remove("selected");
    graph.prevHighlightNode = "";
    graph.setStyle({ resetOpacity: true });

    var selected = $rootScope.getSelected();
    var selectedIndex = _(graph.nodeData.nodes).findIndex({ code: selected.code });
    nodeData = graph.nodeData.nodes[selectedIndex];
  }
};

Graph.prototype.onDblClickHandler = function(d) {
  $rootScope.gotoSubject(d.code);
};

function zoomScale(node, edge) {
  node.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
  edge.attr("transform", "translate(" + d3.event.translate + ") scale(" + d3.event.scale + ")");
}

function updateCorrespondingEdge(graph, subjectCode, operation) {
  var position = _(graph.nodeData.nodes).findIndex({ code: subjectCode }),
      data = graph.nodeData,
      edges = graph.edges[0];
  for (var i = 0; i < data.links.length; ++i) {
    var source = data.links[i].source,
        target = data.links[i].target;
    if (position === source || position === target) {
      switch (operation) {
        case DELETE:
          edges[i].style.display = "none";
          break;
        case RESTORE:
          if (graph.deletedNodeContainer.indexOf(data.nodes[source].code) === -1
            && graph.deletedNodeContainer.indexOf(data.nodes[target].code) === -1) {
            edges[i].style.display = "inline";
        }
      }
    }
  }

  if (operation === DELETE) {
    graph.deletedNodeContainer.push(subjectCode);
  } else {
    var nodePosition = graph.deletedNodeContainer.indexOf(subjectCode);
    graph.deletedNodeContainer.slice(nodePosition, nodePosition + 1);
  }
}

function SetQueue() {
  this._container = [];
}

SetQueue.prototype = {
  push: function(item) {
    if (this._container.indexOf(item) < 0) {
      this._container.push(item);
    }
  },

  get: function(index) {
    return this._container[index];
  },

  length: function() {
    return this._container.length;
  }
};

function makeRestoreButton() {
  var graphContainer = document.querySelector("#graph");
  var restoreBtn = document.createElement("button");
  restoreBtn.classList.add("btn");
  restoreBtn.id = "restoreBtn";
  restoreBtn.innerHTML = "Restore Node";
  restoreBtn.style.display = "none";
  graphContainer.appendChild(restoreBtn);

  return restoreBtn;
}
