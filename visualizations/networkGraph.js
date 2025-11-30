class LaserTagNetworkGraph extends LaserTagVisualizations {
	/**
     * Create player interaction network graph
     */
    loadData(processor) {
		const networkData = processor.calculatePlayerNetwork();
        const container = this.getContainer();
        container.innerHTML = '';

        if (!networkData || !networkData.nodes || networkData.nodes.length === 0) {
            container.innerHTML = '<p class="no-data">No player interaction data available</p>';
            return;
        }

        const width = 800;
        const height = 600;
        const margin = { top: 20, right: 20, bottom: 20, left: 20 };

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('class', 'network-graph');

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
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .attr('orient', 'auto')
            .append('path')
            .attr('d', 'M0,-5L10,0L0,5')
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
            .attr('fill', d => d.color)
            .attr('stroke', '#fff')
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
            .style('fill', '#333')
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
            .text(d => d.name);

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
            .style('fill', '#333')
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
            .style('fill', '#666')
            .text('Shot direction');

        legend.append('text')
            .attr('x', 0)
            .attr('y', 35)
            .style('font-size', '11px')
            .style('fill', '#666')
            .text('Line thickness = shot count');

        // Store chart reference
        this.nodeGraph = { svg, simulation };
    }
}