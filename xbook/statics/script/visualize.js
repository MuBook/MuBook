/**
 * Tree Structure Visualization
 * Author: Po Chen
 * Last Update Date: 7-9-2013
 *
 * Credit: D3.js (d3js.org)
 */

function visualize(url){
	d3.json(url, function(error, data){
		console.log(error);
		var tree = d3.layout.tree()
			.size([800, 500])
			.separation(
				function(a, b){ return (a.parent == b.parent ? 80 : 100); }
			);

		var diagonal = d3.svg.diagonal();

		var svg = d3.select("div#graph").append("div")
			.classed("center", 1)
			.style({"width": "1000px"})
			.append("svg")
				.attr("width", 1000)
				.attr("height", 800);

		svg.append("rect")
			.attr("width", 1000)
			.attr("height", 800)
			.classed("background", 1);

		svg = svg.append("g").attr("transform", "translate(100, 100)");

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
				.attr("r", 40);

			node.append("text")
				.attr("dy", ".31em")
				.attr("text-anchor", "middle")
				.text(function(d) { return d.name; });

		})(data);
	});
}
