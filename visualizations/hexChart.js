class LaserTagHexagon extends LaserTagVisualizations {
	/**
	 * Create fullscreen hexagon chart with detailed metrics
	 */
	createFullscreen(metricsInfo, container, detailsContainer) {
		// Create larger hexagon chart
		const width = 600;
		const height = 600;
		const radius = Math.min(width, height) / 2 - 80;
		const centerX = width / 2;
		const centerY = height / 2;

		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'hexagon-chart fullscreen');

		const g = svg.append('g')
			.attr('transform', `translate(${centerX},${centerY})`);

		// Data preparation
		const metrics = [
			{ name: 'Trickshot', value: metricsInfo.trickshot.normalized, color: '#e74c3c', info: metricsInfo.trickshot },
			{ name: 'Stealth', value: metricsInfo.stealth.normalized, color: '#9b59b6', info: metricsInfo.stealth },
			{ name: 'Speed', value: metricsInfo.speed.normalized, color: '#f39c12', info: metricsInfo.speed },
			{ name: 'RPM', value: metricsInfo.rpm.normalized, color: '#e67e22', info: metricsInfo.rpm },
			{ name: 'Range', value: metricsInfo.range.normalized, color: '#2ecc71', info: metricsInfo.range },
			{ name: 'Accuracy', value: metricsInfo.accuracy.normalized, color: '#1abc9c', info: metricsInfo.accuracy }
		];

		const angleSlice = (Math.PI * 2) / metrics.length;
		const radiusScale = d3.scaleLinear().domain([0, 100]).range([0, radius]);

		// Create enhanced grid with more detail
		const gridLevels = 10;
		for (let level = 1; level <= gridLevels; level++) {
			const levelRadius = (radius / gridLevels) * level;
			
			g.append('circle')
				.attr('r', levelRadius)
				.style('fill', 'none')
				.style('stroke', level % 2 === 0 ? 'rgba(127, 140, 141, 0.4)' : 'rgba(127, 140, 141, 0.2)')
				.style('stroke-width', level % 2 === 0 ? 1.5 : 1);

			if (level % 2 === 0) {
				g.append('text')
					.attr('x', 8)
					.attr('y', -levelRadius + 4)
					.text(level * 10)
					.style('font-size', '12px')
					.style('fill', '#7f8c8d');
			}
		}

		// Create axis lines
		metrics.forEach((d, i) => {
			const angle = i * angleSlice - Math.PI / 2;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;

			g.append('line')
				.attr('x1', 0).attr('y1', 0)
				.attr('x2', x).attr('y2', y)
				.style('stroke', 'rgba(127, 140, 141, 0.5)')
				.style('stroke-width', 2);
		});

		// Create the data polygon with animation
		const lineGenerator = d3.line()
			.x((d, i) => Math.cos(i * angleSlice - Math.PI / 2) * radiusScale(d.value))
			.y((d, i) => Math.sin(i * angleSlice - Math.PI / 2) * radiusScale(d.value))
			.curve(d3.curveLinearClosed);

		g.append('path')
			.datum(metrics)
			.attr('d', lineGenerator)
			.style('fill', 'rgba(52, 152, 219, 0.3)')
			.style('stroke', 'rgba(52, 152, 219, 1)')
			.style('stroke-width', 4);

		// Add enhanced data points
		g.selectAll('.data-point')
			.data(metrics)
			.enter().append('circle')
			.attr('cx', (d, i) => Math.cos(i * angleSlice - Math.PI / 2) * radiusScale(d.value))
			.attr('cy', (d, i) => Math.sin(i * angleSlice - Math.PI / 2) * radiusScale(d.value))
			.attr('r', 8)
			.style('fill', d => d.color)
			.style('stroke', '#fff')
			.style('stroke-width', 3)
			.style('cursor', 'pointer');

		// Add enhanced labels
		metrics.forEach((d, i) => {
			const angle = i * angleSlice - Math.PI / 2;
			const labelRadius = radius + 40;
			const x = Math.cos(angle) * labelRadius;
			const y = Math.sin(angle) * labelRadius;

			g.append('text')
				.attr('x', x).attr('y', y + 4)
				.style('text-anchor', 'middle')
				.style('font-size', '16px')
				.style('font-weight', 'bold')
				.style('fill', d.color)
				.text(d.name);

			// Add value labels
			g.append('text')
				.attr('x', x).attr('y', y + 20)
				.style('text-anchor', 'middle')
				.style('font-size', '12px')
				.style('fill', '#666')
				.text(`${d.value.toFixed(1)}/100`);
		});

		// Create detailed metrics table
		const metricsTable = document.createElement('div');
		metricsTable.className = 'metrics-details';
		metricsTable.innerHTML = `
			<h3>Detailed Metrics</h3>
			<table class="metrics-table">
				<thead>
					<tr>
						<th>Metric</th>
						<th>Raw Value</th>
						<th>Normalized Score</th>
						<th>Performance Level</th>
					</tr>
				</thead>
				<tbody>
					${metrics.map(metric => `
						<tr>
							<td><span style="color: ${metric.color}; font-weight: bold;">${metric.name}</span></td>
							<td>${metric.info.value}${metric.info.unit}</td>
							<td>${metric.value.toFixed(1)}/100</td>
							<td><span class="performance-badge ${this.getPerformanceLevel(metric.value)}">${this.getPerformanceText(metric.value)}</span></td>
						</tr>
					`).join('')}
				</tbody>
			</table>
		`;
		detailsContainer.appendChild(metricsTable);
	}

	/**
	 * Create hexagon radar chart using D3.js
	 */
	loadData(processor) {
		const metricsInfo = processor.getMetricsInfo();
		const container = this.getContainer();
		container.innerHTML = ''; // Clear existing content

		// Chart dimensions and setup
		const width = 400;
		const height = 400;
		const radius = Math.min(width, height) / 2 - 50;
		const centerX = width / 2;
		const centerY = height / 2;

		// Create SVG
		const svg = d3.select('#hexChart')
			.append('svg')
			.attr('width', width)
			.attr('height', height)
			.attr('class', 'hexagon-chart');

		const g = svg.append('g')
			.attr('transform', `translate(${centerX},${centerY})`);

		// Data preparation
		const metrics = [
			{ name: 'Trickshot', value: metricsInfo.trickshot.normalized, color: '#e74c3c', info: metricsInfo.trickshot },
			{ name: 'Stealth', value: metricsInfo.stealth.normalized, color: '#9b59b6', info: metricsInfo.stealth },
			{ name: 'Speed', value: metricsInfo.speed.normalized, color: '#f39c12', info: metricsInfo.speed },
			{ name: 'RPM', value: metricsInfo.rpm.normalized, color: '#e67e22', info: metricsInfo.rpm },
			{ name: 'Range', value: metricsInfo.range.normalized, color: '#2ecc71', info: metricsInfo.range },
			{ name: 'Accuracy', value: metricsInfo.accuracy.normalized, color: '#1abc9c', info: metricsInfo.accuracy }
		];

		const angleSlice = (Math.PI * 2) / metrics.length;

		// Create scales
		const radiusScale = d3.scaleLinear()
			.domain([0, 100])
			.range([0, radius]);

		// Create grid circles
		const gridLevels = 5;
		for (let level = 1; level <= gridLevels; level++) {
			const levelRadius = (radius / gridLevels) * level;
			
			g.append('circle')
				.attr('cx', 0)
				.attr('cy', 0)
				.attr('r', levelRadius)
				.attr('class', 'grid-circle')
				.style('fill', 'none')
				.style('stroke', 'rgba(127, 140, 141, 0.3)')
				.style('stroke-width', 1);

			// Add level labels
			if (level < gridLevels) {
				g.append('text')
					.attr('x', 5)
					.attr('y', -levelRadius + 4)
					.text((100 / gridLevels) * level)
					.attr('class', 'grid-label')
					.style('font-size', '10px')
					.style('fill', '#7f8c8d');
			}
		}

		// Create axis lines
		metrics.forEach((d, i) => {
			const angle = i * angleSlice - Math.PI / 2;
			const x = Math.cos(angle) * radius;
			const y = Math.sin(angle) * radius;

			g.append('line')
				.attr('x1', 0)
				.attr('y1', 0)
				.attr('x2', x)
				.attr('y2', y)
				.attr('class', 'axis-line')
				.style('stroke', 'rgba(127, 140, 141, 0.3)')
				.style('stroke-width', 1);
		});

		// Create the data polygon
		const lineGenerator = d3.line()
			.x((d, i) => {
				const angle = i * angleSlice - Math.PI / 2;
				return Math.cos(angle) * radiusScale(d.value);
			})
			.y((d, i) => {
				const angle = i * angleSlice - Math.PI / 2;
				return Math.sin(angle) * radiusScale(d.value);
			})
			.curve(d3.curveLinearClosed);

		// Add the filled area
		g.append('path')
			.datum(metrics)
			.attr('d', lineGenerator)
			.attr('class', 'data-area')
			.style('fill', 'rgba(52, 152, 219, 0.2)')
			.style('stroke', 'rgba(52, 152, 219, 1)')
			.style('stroke-width', 3)
			.style('opacity', 0)
			.transition()
			.duration(1500)
			.ease(d3.easeBackOut)
			.style('opacity', 1);

		// Add data points
		const dataPoints = g.selectAll('.data-point')
			.data(metrics)
			.enter().append('circle')
			.attr('class', 'data-point')
			.attr('cx', (d, i) => {
				const angle = i * angleSlice - Math.PI / 2;
				return Math.cos(angle) * radiusScale(d.value);
			})
			.attr('cy', (d, i) => {
				const angle = i * angleSlice - Math.PI / 2;
				return Math.sin(angle) * radiusScale(d.value);
			})
			.attr('r', 0)
			.style('fill', d => d.color)
			.style('stroke', '#fff')
			.style('stroke-width', 2)
			.style('cursor', 'pointer')
			.on('mouseover', function(event, d) {
				d3.select(this)
					.transition()
					.duration(200)
					.attr('r', 8);

				// Create tooltip
				const tooltip = g.append('g')
					.attr('class', 'tooltip')
					.style('pointer-events', 'none');

				const tooltipBg = tooltip.append('rect')
					.attr('class', 'tooltip-bg')
					.style('fill', 'rgba(44, 62, 80, 0.9)')
					.style('stroke', d.color)
					.style('stroke-width', 2)
					.style('rx', 5);

				const tooltipText = tooltip.append('text')
					.attr('class', 'tooltip-text')
					.style('fill', '#fff')
					.style('font-size', '12px')
					.style('text-anchor', 'middle');

				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '0.8em')
					.style('font-weight', 'bold')
					.text(d.name);

				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.2em')
					.text(`${d.info.value}${d.info.unit}`);

				tooltipText.append('tspan')
					.attr('x', 0)
					.attr('dy', '1.2em')
					.text(`(${d.value.toFixed(1)}/100)`);

				// Position tooltip
				const bbox = tooltipText.node().getBBox();
				tooltipBg
					.attr('x', bbox.x - 8)
					.attr('y', bbox.y - 4)
					.attr('width', bbox.width + 16)
					.attr('height', bbox.height + 8);

				const angle = metrics.indexOf(d) * angleSlice - Math.PI / 2;
				const tooltipX = Math.cos(angle) * (radiusScale(d.value) + 40);
				const tooltipY = Math.sin(angle) * (radiusScale(d.value) + 40);

				tooltip.attr('transform', `translate(${tooltipX},${tooltipY})`);
			})
			.on('mouseout', function(event, d) {
				d3.select(this)
					.transition()
					.duration(200)
					.attr('r', 6);

				g.select('.tooltip').remove();
			});

		// Animate the data points
		dataPoints
			.transition()
			.duration(1500)
			.delay((d, i) => i * 100)
			.ease(d3.easeBackOut)
			.attr('r', 6);

		// Add axis labels
		metrics.forEach((d, i) => {
			const angle = i * angleSlice - Math.PI / 2;
			const labelRadius = radius + 25;
			const x = Math.cos(angle) * labelRadius;
			const y = Math.sin(angle) * labelRadius;

			g.append('text')
				.attr('x', x)
				.attr('y', y + 4)
				.attr('class', 'axis-label')
				.style('text-anchor', 'middle')
				.style('font-size', '12px')
				.style('font-weight', 'bold')
				.style('fill', '#2c3e50')
				.style('opacity', 0)
				.text(d.name)
				.transition()
				.duration(1500)
				.delay(i * 100)
				.style('opacity', 1);
		});

		// Add title
		g.append('text')
			.attr('x', 0)
			.attr('y', -radius - 35)
			.attr('class', 'chart-title')
			.style('text-anchor', 'middle')
			.style('font-size', '16px')
			.style('font-weight', 'bold')
			.style('fill', '#2c3e50')
			.text('Performance Radar Chart');

		// Add click handler for fullscreen
		svg.style('cursor', 'pointer')
			.on('click', () => {
				this.openFullscreen('hexagon', metricsInfo, 'Player Performance Hexagon - Detailed View');
			});

		// Add fullscreen indicator
		svg.append('text')
			.attr('x', width - 20)
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