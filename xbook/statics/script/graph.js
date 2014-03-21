var DELETE = 0,
	RESTORE = 1;

function Graph(config) {
	/* Pre-render setup */
	this.deletedNodeContainer = [];
	this.prevHighlightNode = "";
	this.renderer = new dagreD3.Renderer();
	this.layout = dagreD3.layout();
	this.g = new dagreD3.Digraph();

	this.parentContainer = "#graph"
	this.name = "graphSVG"
	this.data = null;
	this.width = window.innerWidth;
	this.height = window.innerHeight;
	this.svg = null;
	/* node/edge are d3.select() */
	this.node = null;
	this.edge = null;
	/* nodes/edges are svg.selectAll() */
	this.nodes = null;
	this.edges = null;
	this.rects = null;
	this.setMakeNode(defaultMakeNode);
	this.setMakeGraph(defaultMakeGraph);
	this.setCenterGraphFunction(DefaultCenterGraph);
	this.setStyleFunction(defaultSetStyle);
	this.setDeleteNode(defaultDeleteNode);
	this.setHighlightSubtree(defaultHighlightSubtree);
	this.setOnClickHandler(defaultOnClickHandler);
	this.drawEdgePath = null;
	this.postRenderer = null;
	this._id = null;
	this.centerPosition = null;

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

Graph.prototype.setMakeNode = function(func) {
	this._makeNode = func;
}

Graph.prototype.setMakeGraph = function(func) {
	this.makeGraph = func;
}

Graph.prototype.renderGraph = function() {
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
        .data(this.data.nodes);
	this.rects = this.svg.selectAll(".node rect")
		.data(this.data.nodes);
	this.edges = this.svg.selectAll(".edgePath")
		.data(this.data.links);
	this.node = d3.select(this._id + " .nodes");
	this.edge = d3.select(this._id + " .edgePaths");

	this.setStyle({resetOpacity: true});
}

Graph.prototype.setCenterGraphFunction = function(func) {
	this._centerGraph = func;
}

Graph.prototype.setStyleFunction = function(func) {
	this.setStyle = func;
}

Graph.prototype.centerGraph = function(isPrereq) {
	this.centerPosition = this._centerGraph(isPrereq);
}

Graph.prototype.addPanZoom = function(scaleRange) {
	node = this.node;
	edge = this.edge;
	this.svg.call(
        d3.behavior.zoom()
          .translate(this.centerPosition)
          .scaleExtent([0.4, 2])
          .on("zoom", function() {zoomScale(node, edge);})
     );
}

Graph.prototype.setDeleteNode = function(func) {
	this.deleteNode = func;
}

Graph.prototype.setHighlightSubtree = function(func) {
	this.highlightSubtree = func;
}

Graph.prototype.setOnClickHandler = function(func) {
	this.onClickHandler = func;
}

Graph.prototype.addOnClickListener = function(config) {
	graph = this;
	this.nodes.on("click",
		function(d) {
			graph.onClickHandler(d, graph, this);
		}
	);
}

function defaultMakeNode(node) {
	return { label: node.code || node.id };
}

function defaultMakeGraph() {
	for (var i = 0; i < this.data.nodes.length; ++i) {
		this.g.addNode(i, this._makeNode(this.data.nodes[i]));
	}

	for (var i = 0; i < this.data.links.length; ++i) {
		this.g.addEdge(null, this.data.links[i].source, this.data.links[i].target);
	}
}

function DefaultCenterGraph(isPrereq) {
        var x = this.nodes[0][0].getBoundingClientRect().left,
            y = this.nodes[0][0].getBoundingClientRect().bottom;
        var centerNodeTranslation = [isPrereq ? (-x + 240) + this.width / 2
                                    : (-x + 240) + this.width / 2,
                                    isPrereq ? this.height / 4 : -y + this.height / 2];
        this.node.attr("transform", "translate(" + centerNodeTranslation + ")");
        this.edge.attr("transform", "translate(" + centerNodeTranslation + ")");
        return centerNodeTranslation;
      }

function zoomScale(node, edge) {
	node.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
	edge.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
}

function defaultSetStyle(config) {
	if (config.resetOpacity && config.dimOpacity) {
		console.error("Don't be silly mate");
	} else if (config.resetOpacity) {
		for (var i = 0; i < this.edges[0].length; ++i) {
		    this.edges[0][i].style.opacity = 1;
		}
		for (var i = this.nodes[0].length - 1; i >=0; --i) {
		  	this.nodes[0][i].classList.add("visible")
		}
	} else if (config.dimOpacity) {
		for (var i = 0; i < this.edges[0].length; ++i) {
		    this.edges[0][i].style.opacity = 0.2;
		}
		for (var i = this.nodes[0].length - 1; i >=0; --i) {
		  	this.nodes[0][i].classList.remove("visible")
		}
	}

	if (config.removeSelected) {
		for (var i = this.nodes[0].length - 1; i >=0; --i) {
			this.nodes[0][i].classList.remove("selected");
		}
	}

	if (config.highlightRoot) {
		this.rects
        .attr("style", function(d) {
          return d.root ? "stroke: red" : "inherit";
        });
	}
}

function defaultOnClickHandler(d, graph, clickedNode) {
	if (d3.event.button === 0 && d3.event.shiftKey) {
		graph.deleteNode(d.code, DELETE);
	}

	graph.setStyle({dimOpacity: true, removeSelected: true});

	if (d.code != graph.prevHighlightNode) {
		graph.highlightSubtree(d.code);
		clickedNode.classList.add("selected");
		this.prevHighlightNode = d.code;
	} else {
		clickedNode.classList.remove("selected");
		graph.prevHighlightNode = "";
		graph.setStyle({resetOpacity: true});
	}
}

function defaultDeleteNode(subjectCode, node) {
	document.querySelector("#restoreBtn").style.display = "inline";
	node.classList.add("deleted");
	_updateCorrespondingEdge(this.data, this.deletedNodeContainer, subjectCode, DELETE);
	this.setStyle({resetOpacity: true});
}

function _updateCorrespondingEdge(graph, nodeContainer, subjectCode, operation) {
	var position = _nodeIndex(graph, subjectCode);

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

function defaultHighlightSubtree(subjectCode) {
	var nodeQueue = new SetQueue();
	var rootPosition = 0;
	for (var i = 0; i < this.data.nodes.length; ++i) {
		if (this.data.nodes[i].code === subjectCode) {
			rootPosition = i;
			break;
		}
	}
	nodeQueue.push(rootPosition);
	var currentRoot, queueHead = 0;
	while (queueHead != nodeQueue.length()) {
		currentRoot = nodeQueue.get(queueHead++);
		if (this.deletedNodeContainer.indexOf(this.data.nodes[currentRoot].code) === -1) {
			this.nodes[0][currentRoot].classList.add("visible");
			for (var i = 0; i < this.data.links.length; ++i) {
				if (this.data.links[i].source == currentRoot) {
					this.edges[0][i].style.opacity = 1;
					nodeQueue.push(this.data.links[i].target);
				}
			}
		}
	}
}

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
