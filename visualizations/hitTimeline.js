class LaserTagHitTimeline extends LaserTagVisualizations {
	/**
	 * Create fullscreen timeline chart with enhanced details
	 */
	createFullscreen(hits, container, detailsContainer) {
		const margin = { top: 40, right: 60, bottom: 80, left: 80 };
		const width = 800 - margin.left - margin.right;
		const height = 500 - margin.top - margin.bottom;

		const svg = d3.select(container)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Prepare enhanced timeline data
		const timelineData = hits.map((hit, index) => ({
			time: hit.hitMatchState?.gameTime || 0,
			points: (hit.basePointValue || 0) * (hit.pointMultiplier || 1),
			index: index,
			component: hit.hitComponent || 'Unknown',
			range: hit.hitRange || 0,
			multiplier: hit.pointMultiplier || 1
		})).sort((a, b) => a.time - b.time);

		// Create scales
		const xScale = d3.scaleLinear()
			.domain(d3.extent(timelineData, d => d.time))
			.range([0, width]);

		const yScale = d3.scaleLinear()
			.domain([0, d3.max(timelineData, d => d.points)])
			.range([height, 0]);

		// Enhanced axes
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).tickFormat(d => `${d}s`))
			.append('text')
			.attr('x', width / 2)
			.attr('y', 50)
			.attr('fill', '#2c3e50')
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.text('Game Time (seconds)');

		g.append('g')
			.call(d3.axisLeft(yScale))
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', -height / 2)
			.attr('fill', '#2c3e50')
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.text('Points Earned');

		// Enhanced line and area
		const line = d3.line()
			.x(d => xScale(d.time))
			.y(d => yScale(d.points))
			.curve(d3.curveMonotoneX);

		const area = d3.area()
			.x(d => xScale(d.time))
			.y0(height)
			.y1(d => yScale(d.points))
			.curve(d3.curveMonotoneX);

		g.append('path')
			.datum(timelineData)
			.attr('fill', 'rgba(52, 152, 219, 0.2)')
			.attr('d', area);

		g.append('path')
			.datum(timelineData)
			.attr('fill', 'none')
			.attr('stroke', '#3498db')
			.attr('stroke-width', 3)
			.attr('d', line);

		// Enhanced points with tooltips
		g.selectAll('.dot')
			.data(timelineData)
			.enter().append('circle')
			.attr('cx', d => xScale(d.time))
			.attr('cy', d => yScale(d.points))
			.attr('r', d => 3 + d.multiplier)
			.attr('fill', d => d.multiplier > 1 ? '#e74c3c' : '#27ae60')
			.attr('stroke', '#fff')
			.attr('stroke-width', 2)
			.style('cursor', 'pointer');

		// Create hit details table
		this.createHitDetailsTable(timelineData, detailsContainer);
	}

	/**
	 * Create timeline chart showing hits over time
	 */
	loadData(processor) {
		const hits = processor.hits
		const container = this.getContainer();
		container.innerHTML = ''; // Clear existing content

		// Compact 1-dimensional preview timeline
		// Preview shows hits along a single horizontal row (x = game time). The fullscreen modal keeps the 2D chart.
		const margin = { top: 10, right: 20, bottom: 30, left: 40 };
		const width = Math.max(300, container.offsetWidth) - margin.left - margin.right;
		const height = 120 - margin.top - margin.bottom; // compact preview height

		const svg = d3.select('#timelineChart')
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Prepare data
		const timelineData = hits.map((hit, index) => ({
			time: hit.hitMatchState?.gameTime || 0,
			points: (hit.basePointValue || 0) * (hit.pointMultiplier || 1),
			multiplier: hit.pointMultiplier || 1,
			component: hit.hitComponent || 'Unknown',
			index: index
		})).sort((a, b) => a.time - b.time);

		if (timelineData.length === 0) {
			container.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:10px;">No hits to display</p>';
			return;
		}

		// Scales (x = time). y is fixed to create a 1D layout.
		const xScale = d3.scaleLinear()
			.domain(d3.extent(timelineData, d => d.time))
			.nice()
			.range([0, width]);

		const rowY = height / 2; // single row

		// Draw baseline
		g.append('line')
			.attr('x1', 0)
			.attr('y1', rowY)
			.attr('x2', width)
			.attr('y2', rowY)
			.attr('stroke', '#ecf0f1')
			.attr('stroke-width', 2);

		// X axis
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).ticks(6).tickFormat(d => `${d}s`));

		// Draw hits as circles on a single horizontal line. Encode points by radius and multiplier by color.
		const maxPoints = d3.max(timelineData, d => d.points) || 1;
		const rScale = d3.scaleSqrt().domain([0, maxPoints]).range([3, 10]);
		const colorScale = d3.scaleOrdinal().domain([1, 2, 3, 4]).range(['#27ae60', '#f1c40f', '#e67e22', '#e74c3c']);

		const hitNodes = g.selectAll('.hit')
			.data(timelineData)
			.enter().append('g')
			.attr('class', 'hit')
			.attr('transform', d => `translate(${xScale(d.time)}, ${rowY})`)
			.style('cursor', 'pointer');

		hitNodes.append('circle')
			.attr('r', d => rScale(d.points))
			.attr('fill', d => colorScale(Math.min(4, Math.max(1, Math.round(d.multiplier)))))
			.attr('stroke', '#fff')
			.attr('stroke-width', 1.5)
			.on('mouseover', function(event, d) {
				d3.select(this).attr('stroke-width', 2.5);
				// tooltip
				const tooltip = d3.select(container).append('div')
					.attr('class', 'tt')
					.style('position', 'absolute')
					.style('pointer-events', 'none')
					.style('background', 'rgba(44,62,80,0.9)')
					.style('color', '#fff')
					.style('padding', '6px 8px')
					.style('border-radius', '4px')
					.style('font-size', '12px')
					.html(`<strong>${d.points} pts</strong><br/>${d.time}s • ${d.component}`);

				const matrix = this.getScreenCTM().translate(+this.getAttribute('cx'), +this.getAttribute('cy'));
				const left = window.pageXOffset + matrix.e + margin.left + 10;
				const top = window.pageYOffset + matrix.f + margin.top - 30;
				tooltip.style('left', `${left}px`).style('top', `${top}px`);
			})
			.on('mouseout', function() {
				d3.select(this).attr('stroke-width', 1.5);
				d3.select(container).selectAll('.tt').remove();
			});

		// Add small tick for each hit (subtle) to emphasize 1D nature
		hitNodes.append('line')
			.attr('x1', 0)
			.attr('y1', d => rScale(d.points) + 4)
			.attr('x2', 0)
			.attr('y2', d => rScale(d.points) + 12)
			.attr('stroke', 'rgba(44,62,80,0.08)')
			.attr('stroke-width', 1);

		// Add click handler for fullscreen
		svg.style('cursor', 'pointer')
			.on('click', () => {
				this.openFullscreen('timeline', hits, 'Hit Timeline - Detailed Analysis');
			});

		// Add fullscreen indicator
		svg.append('text')
			.attr('x', width + margin.left + margin.right - 20)
			.attr('y', 20)
			.attr('class', 'fullscreen-indicator')
			.style('font-size', '16px')
			.style('fill', '#3498db')
			.style('cursor', 'pointer')
			.text('🔍')
			.append('title')
			.text('Click to view in fullscreen');
	}
}