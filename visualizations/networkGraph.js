class LaserTagNetworkGraph extends LaserTagVisualizations {
	constructor(targetElementId) {
		super(targetElementId);
		this.networkData = null;
		this.currentProcessor = null;
	}

	/**
	 * Create player interaction network graph
	 */
	loadData(processor) {
		this.currentProcessor = processor;
		const networkData = processor.calculatePlayerNetwork();
		this.networkData = networkData;
		const container = this.getContainer();
		
		console.log('Container element:', container);
		console.log('Container innerHTML before clear:', container.innerHTML);
		
		container.innerHTML = '';

		console.log('NetworkGraph loadData called');
		console.log('Network data received:', networkData);

		if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
			console.log('No network data available, showing no-data message');
			container.innerHTML = '<p class="no-data">No player interaction data available</p>';
			return;
		}

		// Ensure container has proper dimensions
		container.style.position = 'relative';

		// Force container to have proper dimensions if not already set
		if (container.clientWidth === 0) {
			container.style.width = '100%';
			container.style.minWidth = '400px';
		}
		
		const containerWidth = container.clientWidth || container.offsetWidth || 400;
		const width = Math.max(400, containerWidth - 40);
		const height = 500; // Reduced from 600px to account for header
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };

		console.log('Container dimensions:', {
			clientWidth: container.clientWidth,
			offsetWidth: container.offsetWidth,
			clientHeight: container.clientHeight,
			calculatedWidth: width,
			calculatedHeight: height
		});

		const svg = d3.select(container)
			.append('svg')
			//.attr('width', width)
			//.attr('height', height)
			.style("width", "100%")
			.style("height", "100%")
			.attr("viewBox", `0 0 ${width} ${height}`)
			.attr('class', 'network-graph');

		console.log('SVG created with dimensions:', width, 'x', height);

		// Create force simulation
		const simulation = d3.forceSimulation(networkData.nodes)
			.force('link', d3.forceLink(networkData.links).id(d => d.id).distance(150))
			.force('charge', d3.forceManyBody().strength(-300))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(30));

		// Add arrow markers for directed edges
		svg.append('defs').append('marker')
			.attr('id', 'arrowhead')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 22)
			.attr('refY', 0)
			.attr('markerWidth', 4)
			.attr('markerHeight', 4)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M0,-3L6,0L0,3')
			.attr('fill', '#666');

		// Create links
		const link = svg.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(networkData.links)
			.enter().append('line')
			.attr('stroke', '#666')
			.attr('stroke-opacity', 0.7)
			.attr('stroke-width', d => d.width)
			.attr('marker-end', 'url(#arrowhead)');

		// Create nodes
		const node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('circle')
			.data(networkData.nodes)
			.enter().append('circle')
			.attr('r', 20)
			.attr('fill', d => "#000")
			.attr('stroke', d => d.color)
			.attr('stroke-width', 3)
			.call(d3.drag()
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));

		// Add node labels
		const labels = svg.append('g')
			.attr('class', 'labels')
			.selectAll('text')
			.data(networkData.nodes)
			.enter().append('text')
			.text(d => d.name)
			.style('font-size', '12px')
			.style('font-weight', 'bold')
			.style('text-anchor', 'middle')
			.style('fill', d => d.background)
			.style('pointer-events', 'none');

		// Add tooltips for links
		link.append('title')
			.text(d => {
				const sourceName = networkData.nodes.find(n => n.id === d.source.id)?.name || d.source.id;
				const targetName = networkData.nodes.find(n => n.id === d.target.id)?.name || d.target.id;
				return `${sourceName} shot ${targetName} ${d.value} time(s)`;
			});

		// Add tooltips for nodes
		node.append('title')
			.text(d => {
				let tooltip = d.name;
				if (d.teamId && d.teamId > 0) {
					tooltip += `\nTeam: ${d.teamId}`;
				}
				return tooltip;
			});

		// Update positions on simulation tick
		simulation.on('tick', () => {
			link
				.attr('x1', d => d.source.x)
				.attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

			node
				.attr('cx', d => d.x)
				.attr('cy', d => d.y);

			labels
				.attr('x', d => d.x)
				.attr('y', d => d.y + 5);
		});

		// Drag functions
		function dragstarted(event, d) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(event, d) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragended(event, d) {
			if (!event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		// Add a legend
		const legend = svg.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${width - 150}, 30)`);

		legend.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.style('font-size', '14px')
			.style('font-weight', 'bold')
			.style('fill', '#fff')
			.text('Network Legend');

		legend.append('line')
			.attr('x1', 0)
			.attr('y1', 15)
			.attr('x2', 20)
			.attr('y2', 15)
			.attr('stroke', '#666')
			.attr('stroke-width', 3)
			.attr('marker-end', 'url(#arrowhead)');

		legend.append('text')
			.attr('x', 25)
			.attr('y', 19)
			.style('font-size', '12px')
			.style('fill', '#aaa')
			.text('Shot direction');

		legend.append('text')
			.attr('x', 0)
			.attr('y', 35)
			.style('font-size', '11px')
			.style('fill', '#aaa')
			.text('Line thickness = shot count');

		legend.append('text')
			.attr('x', 0)
			.attr('y', 50)
			.style('font-size', '11px')
			.style('fill', '#aaa')
			.text('Node color = team color');

		// Store chart reference
		this.nodeGraph = { svg, simulation };
	}

	/**
	 * Render network graph for fullscreen view
	 */
	renderFullscreen(containerId = 'nodeGraphFullscreen') {
		if (!this.networkData || !this.networkData.nodes || this.networkData.nodes.length === 0) {
			console.log('No network data available for fullscreen');
			return;
		}

		const container = document.getElementById(containerId);
		container.innerHTML = '';

		// Fullscreen dimensions
		const width = window.innerWidth - 40;
		const height = window.innerHeight - 120; // Account for header
		const margin = { top: 20, right: 20, bottom: 20, left: 20 };

		console.log('Fullscreen dimensions:', { width, height });

		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'network-graph');

		// Create force simulation with adjusted parameters for larger space
		const simulation = d3.forceSimulation(this.networkData.nodes)
			.force('link', d3.forceLink(this.networkData.links).id(d => d.id).distance(200))
			.force('charge', d3.forceManyBody().strength(-500))
			.force('center', d3.forceCenter(width / 2, height / 2))
			.force('collision', d3.forceCollide().radius(40));

		// Add arrow markers for directed edges
		svg.append('defs').append('marker')
			.attr('id', 'arrowhead-fullscreen')
			.attr('viewBox', '0 -5 10 10')
			.attr('refX', 32)
			.attr('refY', 0)
			.attr('markerWidth', 6)
			.attr('markerHeight', 6)
			.attr('orient', 'auto')
			.append('path')
			.attr('d', 'M0,-4L8,0L0,4')
			.attr('fill', '#cccccc');

		// Create links
		const link = svg.append('g')
			.attr('class', 'links')
			.selectAll('line')
			.data(this.networkData.links)
			.enter().append('line')
			.attr('stroke', '#cccccc')
			.attr('stroke-opacity', 0.8)
			.attr('stroke-width', d => Math.max(2, d.width * 1.5))
			.attr('marker-end', 'url(#arrowhead-fullscreen)');

		// Create nodes (larger for fullscreen)
		const node = svg.append('g')
			.attr('class', 'nodes')
			.selectAll('circle')
			.data(this.networkData.nodes)
			.enter().append('circle')
			.attr('r', 30)
			.attr('fill', d => "#000")
			.attr('stroke', d => d.color)
			.attr('stroke-width', 4)
			.call(d3.drag()
				.on('start', dragstarted)
				.on('drag', dragged)
				.on('end', dragended));

		// Add node labels (larger for fullscreen)
		const labels = svg.append('g')
			.attr('class', 'labels')
			.selectAll('text')
			.data(this.networkData.nodes)
			.enter().append('text')
			.text(d => d.name)
			.style('font-size', '16px')
			.style('font-weight', 'bold')
			.style('text-anchor', 'middle')
			.style('fill', d => d.background)
			.style('pointer-events', 'none');

		// Add tooltips for links
		link.append('title')
			.text(d => {
				const sourceName = this.networkData.nodes.find(n => n.id === d.source.id)?.name || d.source.id;
				const targetName = this.networkData.nodes.find(n => n.id === d.target.id)?.name || d.target.id;
				return `${sourceName} shot ${targetName} ${d.value} time(s)`;
			});

		// Add tooltips for nodes
		node.append('title')
			.text(d => {
				let tooltip = d.name;
				if (d.teamId && d.teamId > 0) {
					tooltip += `\nTeam: ${d.teamId}`;
				}
				return tooltip;
			});

		// Update positions on simulation tick
		simulation.on('tick', () => {
			link
				.attr('x1', d => d.source.x)
				.attr('y1', d => d.source.y)
				.attr('x2', d => d.target.x)
				.attr('y2', d => d.target.y);

			node
				.attr('cx', d => d.x)
				.attr('cy', d => d.y);

			labels
				.attr('x', d => d.x)
				.attr('y', d => d.y + 6);
		});

		// Drag functions
		function dragstarted(event, d) {
			if (!event.active) simulation.alphaTarget(0.3).restart();
			d.fx = d.x;
			d.fy = d.y;
		}

		function dragged(event, d) {
			d.fx = event.x;
			d.fy = event.y;
		}

		function dragended(event, d) {
			if (!event.active) simulation.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}

		// Add a legend (positioned for fullscreen)
		const legend = svg.append('g')
			.attr('class', 'legend')
			.attr('transform', `translate(${width - 200}, 50)`);

		legend.append('text')
			.attr('x', 0)
			.attr('y', 0)
			.style('font-size', '18px')
			.style('font-weight', 'bold')
			.style('fill', '#ffffff')
			.text('Network Legend');

		legend.append('line')
			.attr('x1', 0)
			.attr('y1', 25)
			.attr('x2', 30)
			.attr('y2', 25)
			.attr('stroke', '#cccccc')
			.attr('stroke-width', 4)
			.attr('marker-end', 'url(#arrowhead-fullscreen)');

		legend.append('text')
			.attr('x', 35)
			.attr('y', 29)
			.style('font-size', '14px')
			.style('fill', '#ffffff')
			.text('Shot direction');

		legend.append('text')
			.attr('x', 0)
			.attr('y', 50)
			.style('font-size', '13px')
			.style('fill', '#ffffff')
			.text('Line thickness = shot count');

		legend.append('text')
			.attr('x', 0)
			.attr('y', 70)
			.style('font-size', '13px')
			.style('fill', '#ffffff')
			.text('Node color = team color');

		// Store fullscreen chart reference
		this.fullscreenGraph = { svg, simulation };
	}
}