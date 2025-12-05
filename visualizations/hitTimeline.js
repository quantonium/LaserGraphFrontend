class LaserTagHitTimeline extends LaserTagVisualizations {
	centerPos = 0
	initWidth = 0
	timeEnd = 0

	// Set up dimensions for responsive timeline
	margin = { top: 10, right: 10, bottom: 25, left: 5 };

	constructor(target) {
		super(target)
		window.addEventListener("resize", (e) => {
			this.onWindowResize(e)
		})

		document.getElementById("timelineRangeSlider").addEventListener("change", (e) => {
			this.onTimeZoom(e)
		})
	}

	/**
	 * Create fullscreen timeline chart with enhanced details
	 */
	createFullscreen(hits, container, detailsContainer) {

		// Set up dimensions for responsive timeline
		const margin = { top: 40, right: 60, bottom: 80, left: 80 };
		const containerWidth = container.clientWidth || 400;
		const width = Math.max(300, containerWidth - margin.left - margin.right - 40);
		const height = 400 - margin.top - margin.bottom;

		const svg = d3.select(container)
			.append('svg')
			.attr('width', width + margin.left + margin.right)
			.attr('height', height + margin.top + margin.bottom);

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Prepare enhanced timeline data
		const timelineData = hits;

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
			.attr('fill', '#888')
			.style('text-anchor', 'middle')
			.style('font-size', '14px')
			.text('Game Time (seconds)');

		g.append('g')
			.call(d3.axisLeft(yScale))
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', -height / 2)
			.attr('fill', '#888')
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
			.style('cursor', 'pointer')
			.on('mouseover', function (event, d) {
				d3.select(this).attr('stroke-width', 4).attr('r', d => (3 + d.multiplier) * 1.2);

				// Get player names from global processor
				const processor = window.laserTagApp?.processor;
				const shooterName = processor && processor.playerData && d.shooterId ?
					(processor.playerData[d.shooterId.toString()]?.playerName || `Player ${d.shooterId}`) : 'Unknown';
				const targetName = processor && processor.playerData && d.targetId ?
					(processor.playerData[d.targetId.toString()]?.playerName || `Player ${d.targetId}`) : 'Unknown';

				// Create enhanced tooltip
				const tooltip = d3.select('body').append('div')
					.attr('class', 'fullscreen-tooltip')
					.style('position', 'absolute')
					.style('pointer-events', 'none')
					.style('background', 'rgba(44,62,80,0.95)')
					.style('color', '#fff')
					.style('padding', '12px 15px')
					.style('border-radius', '8px')
					.style('font-size', '14px')
					.style('box-shadow', '0 6px 12px rgba(0,0,0,0.4)')
					.style('border', '1px solid rgba(255,255,255,0.2)')
					.style('z-index', '1001')
					.style('max-width', '300px')
					.html(`
						<div style="font-weight: bold; color: #3498db; margin-bottom: 8px; font-size: 16px;">
							🎯 Hit Details
						</div>
						<div style="margin-bottom: 6px; font-size: 15px;">
							<span style="color: #e74c3c; font-weight: bold;">👤 ${shooterName}</span> tagged 
							<span style="color: #27ae60; font-weight: bold;">👤 ${targetName}</span>
						</div>
						<div style="margin-bottom: 6px;">
							📍 Target: <span style="color: #f39c12; font-weight: bold;">${d.hitFriendlyName} (${d.hitAbbreviation})</span>
						</div>
						<div style="margin-bottom: 6px;">
							💰 Points: <span style="color: #2ecc71; font-weight: bold; font-size: 16px;">${d.points}</span>
							${d.multiplier > 1 ? `<span style="color: #e67e22; font-weight: bold;"> (${d.basePoints} × ${d.multiplier})</span>` : ''}
						</div>
						<div style="color: #95a5a6; font-size: 12px;">
							⏱️ Game Time: ${d.time.toFixed(1)}s
						</div>
					`);

				tooltip.style('left', (event.pageX + 10) + 'px').style('top', (event.pageY - 10) + 'px');
			})
			.on('mouseout', function (event, d) {
				d3.select(this).attr('stroke-width', 2).attr('r', 3 + d.multiplier);
				d3.selectAll('.fullscreen-tooltip').remove();
			});

		// Create hit details table
		this.createHitDetailsTable(timelineData, detailsContainer);
	}

	/**
	 * Highlight time range on the timeline based on external scroll input
	 */
	highlightTimeRange(startTime, endTime) {
		this.currentTimeRange = { startTime, endTime };
		let centerTime = (startTime + endTime) / 2
		this.centerPos = centerTime
		if (!this.currentTimelineData || !this.currentSvg) {
			return;
		}

		// Remove existing highlight
		this.currentSvg.selectAll('.time-range-highlight').remove();

		// Filter hits within the time range
		const hitsInRange = this.currentTimelineData.filter(d =>
			d.time >= startTime && d.time <= endTime
		);

		// Add time range highlight background
		const g = this.currentSvg.select('g');
		const xScale = this.currentXScale;
		const height = this.currentHeight;

		if (xScale && height) {
			// Add highlight rectangle
			g.insert('rect', ':first-child')
				.attr('class', 'time-range-highlight')
				.attr('x', xScale(startTime))
				.attr('y', 0)
				.attr('width', xScale(endTime) - xScale(startTime))
				.attr('height', height)
				.attr('fill', 'rgba(52, 152, 219, 0.15)')
				.attr('stroke', '#3498db')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.style('pointer-events', 'none');

			// Add center line
			g.append('line')
				.attr('class', 'time-range-highlight')
				.attr('x1', xScale(centerTime))
				.attr('y1', 0)
				.attr('x2', xScale(centerTime))
				.attr('y2', height)
				.attr('stroke', '#e74c3c')
				.attr('stroke-width', 2)
				.style('pointer-events', 'none');

			// Highlight hits in range
			g.selectAll('.hit circle')
				.style('opacity', d => {
					return (d.time >= startTime && d.time <= endTime) ? 1.0 : 0.3;
				})
				.attr('stroke-width', d => {
					return (d.time >= startTime && d.time <= endTime) ? 3 : 1.5;
				});

			// Update legend
			this.updateTimeRangeLegend(startTime, endTime, centerTime, hitsInRange.length);
			this.createScrollableTimeline(hitsInRange);
		}
	}

	/**
	 * Update or create time range legend
	 */
	updateTimeRangeLegend(startTime, endTime, centerTime, hitCount) {
		if (!this.currentSvg) return;

		document.getElementById("timelineRangeDisplay").innerText = `${secondsToTimeString(startTime)} - ${secondsToTimeString(endTime)}`
		document.getElementById("timelineHitCount").innerText = `${hitCount} Hits`

		document.getElementById('startTime').value = Math.round(startTime*10)/10;
		document.getElementById('endTime').value = Math.round(endTime*10)/10;
	}

	/**
	 * Create timeline chart showing hits over time
	 */
	loadData(processor) {
		const hits = processor.hits
		const container = this.getContainer();
		container.innerHTML = ''; // Clear existing content

		// Store processor for time range filtering
		this.processor = processor;
		this.allHits = hits;

		// Clear stored references
		this.currentTimelineData = null;
		this.currentSvg = null;
		this.currentXScale = null;
		this.currentHeight = null;
		this.currentTimeRange = null;

		// Prepare data
		const timelineData = hits.map((hit, index) => ({
			time: hit.hitMatchState?.gameTime || 0,
			points: this.processor.getPointInfoForHit(index).playerFinal.get(hit.instigatorStateId.index),
			multiplier: hit.pointMultiplier || 1,
			component: hit.hitComponent || 'Unknown',
			index: index,
			shooterId: hit.instigatorStateId?.index,
			targetId: hit.hitStateId?.index,
			hitFriendlyName: hit.hitFriendlyName || 'Unknown Target',
			hitAbbreviation: hit.hitAbbreviation || 'UNK',
			basePoints: hit.basePointValue || 0
		})).sort((a, b) => a.time - b.time);

		this.currentTimelineData = timelineData

		this.timeEnd = processor.data.SessionInfo.serverTime

		// Set up time range controls
		this.setupTimeRangeControls(this.timeEnd);

		// Create scrollable timeline
		this.createScrollableTimeline(timelineData);
	}

	/**
	 * Set up time range input controls
	 */
	setupTimeRangeControls(maxTime) {
		const startTimeInput = document.getElementById('startTime');
		const endTimeInput = document.getElementById('endTime');
		const applyButton = document.getElementById('applyTimeRange');
		const resetButton = document.getElementById('resetTimeRange');
		const rangeDisplay = document.getElementById('timelineRangeDisplay');

		if (!this.allHits || this.allHits.length === 0) return;

		// Set max values based on game data
		//const maxTime = Math.max(...this.allHits.map(hit => hit.hitMatchState?.gameTime || 0));
		endTimeInput.max = maxTime;
		startTimeInput.max = maxTime;
		endTimeInput.placeholder = maxTime.toFixed(1);

		applyButton.addEventListener('click', () => {
			const startTime = parseFloat(startTimeInput.value) || 0;
			const endTime = parseFloat(endTimeInput.value) || maxTime;

			if (startTime >= endTime) {
				//alert('Start time must be less than end time');
				return;
			}

			this.applyTimeRange(startTime, endTime);
			rangeDisplay.textContent = `Showing ${startTime.toFixed(1)}s - ${endTime.toFixed(1)}s`;
		});

		resetButton.addEventListener('click', () => {
			startTimeInput.value = '';
			endTimeInput.value = '';
			this.resetTimeRange();
		});
	}

	/**
	 * Apply time range filter and update visualization
	 */
	applyTimeRange(startTime, endTime) {
		this.highlightTimeRange(startTime, endTime)
	}

	/**
	 * Reset time range filter
	 */
	resetTimeRange() {
		this.currentTimeRange = null;
		//this.createScrollableTimeline(this.allHits);
	}

	/**
	 * Create scrollable timeline visualization
	 */
	createScrollableTimeline() {
		const container = this.getContainer();
		container.innerHTML = "";
		
		const hits = this.currentTimelineData

		// Use actual container width, don't force minimum
		const containerWidth = document.body.clientWidth || 300;
		const width = Math.max(containerWidth, 1000) - this.margin.left - this.margin.right;
		const containerHeight = 50
		const height = containerHeight - this.margin.top - this.margin.bottom;

		this.initWidth = width

		const svg = d3.select('#timelineChart')
			.append('svg')
			.attr("viewBox", `0 0 ${containerWidth} ${containerHeight}`)
			.attr('width', width + this.margin.left + this.margin.right)
			.attr('height', height + this.margin.top + this.margin.bottom)
		//.style("width", "100%");

		// Store for highlighting
		this.currentSvg = svg;
		this.currentHeight = height;

		const g = svg.append('g')
			.attr('transform', `translate(${this.margin.left},${this.margin.top})`);

		if (hits.length === 0) {
			container.innerHTML = '<p style="text-align:center;color:#7f8c8d;padding:10px;">No hits in selected time range</p>';
			return;
		}

		// Scales (x = time). Create multi-row layout for better visibility
		const timeExtent = d3.extent(hits, d => d.time);
		let xScale = d3.scaleLinear()
			.domain([0, this.timeEnd])
			.nice()
			.range([0, width]);

		// Store for highlighting
		this.currentXScale = xScale;

		// Single row layout like original
		const rowY = height / 2;

		// Draw baseline
		g.append('line')
			.attr('x1', 0)
			.attr('y1', rowY)
			.attr('x2', width)
			.attr('y2', rowY)
			.attr('stroke', '#ecf0f1')
			.attr('stroke-width', 2);

		// X axis with more ticks for scrollable timeline
		const tickCount = Math.max(10, Math.min(30, width / 60));
		g.append('g')
			.attr('transform', `translate(0,${height})`)
			.call(d3.axisBottom(xScale).ticks(tickCount).tickFormat(d => `${d}s`));

		// Add time range indicators if a filter is applied
		if (this.currentTimeRange) {
			const { startTime, endTime } = this.currentTimeRange;
			g.append('rect')
				.attr('x', xScale(startTime))
				.attr('y', 0)
				.attr('width', xScale(endTime - startTime))
				.attr('height', height)
				.attr('fill', 'rgba(52, 152, 219, 0.1)')
				.attr('stroke', '#3498db')
				.attr('stroke-width', 2)
				.attr('stroke-dasharray', '5,5')
				.style('pointer-events', 'none');
		}

		// Draw hits with better distribution across rows
		const maxPoints = d3.max(hits, d => d.points) || 1;
		const rScale = d3.scaleSqrt().domain([0, maxPoints]).range([4, 12]);
		const colorScale = d3.scaleOrdinal().domain([1, 2, 3, 4]).range(['#27ae60', '#f39c12', '#e67e22', '#e74c3c']);



		const hitNodes = g.selectAll('.hit')
			.data(hits)
			.enter().append('g')
			.attr('class', 'hit')
			.attr('transform', d => `translate(${xScale(d.time)}, ${rowY})`)
			.style('cursor', 'pointer');

		hitNodes.append('circle')
			.attr('r', d => 5)
			.attr('fill', d => colorScale(Math.min(4, Math.max(1, Math.round(d.multiplier)))))
			.attr("opacity", d => this.currentTimeRange ? 
				(d.time <= this.currentTimeRange.endTime && d.time >= this.currentTimeRange.startTime ? 1 : .5): 1)
			.on('mouseover', function (event, d) {
				d3.select(this).attr('stroke-width', 3).attr('r', d => 10);

				// Get player names from global processor
				const processor = window.laserTagApp?.processor;
				const shooterName = processor && processor.playerData && d.shooterId ?
					(processor.playerData[d.shooterId.toString()]?.playerName || `Player ${d.shooterId}`) : 'Unknown';
				const targetName = processor && processor.playerData && d.targetId ?
					(processor.playerData[d.targetId.toString()]?.playerName || `Player ${d.targetId}`) : 'Unknown';

				// Create enhanced tooltip
				const tooltip = d3.select('body').append('div')
					.attr('class', 'timeline-preview-tooltip')
					.style('position', 'absolute')
					.style('pointer-events', 'none')
					.style('background', 'rgba(44,62,80,0.95)')
					.style('color', '#fff')
					.style('padding', '12px 15px')
					.style('border-radius', '8px')
					.style('font-size', '14px')
					.style('box-shadow', '0 6px 12px rgba(0,0,0,0.4)')
					.style('border', '1px solid rgba(255,255,255,0.2)')
					.style('z-index', '1001')
					.style('max-width', '300px')
					.html(`
						<div style="font-weight: bold; color: #3498db; margin-bottom: 8px; font-size: 16px;">
							🎯 Hit Details
						</div>
						<div style="margin-bottom: 6px;">
							<span style="color: #e74c3c; font-weight: bold;">👤 ${shooterName}</span> tagged 
							<span style="color: #27ae60; font-weight: bold;">👤 ${targetName}</span>
						</div>
						<div style="margin-bottom: 6px;">
							📍 Target: <span style="color: #f39c12; font-weight: bold;">${d.hitFriendlyName} (${d.hitAbbreviation})</span>
						</div>
						<div style="margin-bottom: 6px;">
							💰 Points: <span style="color: #2ecc71; font-weight: bold; font-size: 16px;">${d.points}</span>
							${d.multiplier > 1 ? `<span style="color: #e67e22; font-weight: bold;"> (${d.basePoints} × ${d.multiplier})</span>` : ''}
						</div>
							<div style="color: #95a5a6; font-size: 12px;">
								⏱️ Game Time: ${d.time.toFixed(1)}s
							</div>
					`);

				tooltip.style('left', (event.pageX + 15) + 'px').style('top', (event.pageY - 15) + 'px');
			})
			.on('mouseout', function (event, d) {
				d3.select(this).attr('stroke-width', 2).attr('r', 5);
				d3.selectAll('.timeline-preview-tooltip').remove();
			});

		// Add small connecting line from hit to baseline
		hitNodes.append('line')
			.attr('x1', 0)
			.attr('y1', d => rScale(d.points) + 3)
			.attr('x2', 0)
			.attr('y2', d => rScale(d.points) + 15)
			.attr('stroke', 'rgba(44,62,80,0.3)')
			.attr('stroke-width', 1);

		// Add click handler for fullscreen
		document.getElementById("timelineRangeBtn").addEventListener("click", () => {
			this.openFullscreen('timeline', hits, 'Hit Timeline - Detailed Analysis');
		})

		// Add fullscreen indicator


		// Timeline is ready
	}


	/**
	 * Create hit details table
	 */
	createHitDetailsTable(timelineData, container) {
		const detailsDiv = document.createElement('div');
		detailsDiv.className = 'hit-details';
		detailsDiv.innerHTML = `
			<h3>Hit Timeline Details (${timelineData.length} hits)</h3>
			<div class="hit-stats">
				<div class="metric-card">
					
					<h2>${timelineData.reduce((sum, hit) => sum + hit.points, 0)}</h2>
					<h5>Total Points</h5>
				</div>
				<div class="metric-card">
					
					<h2>${(timelineData.reduce((sum, hit) => sum + hit.points, 0) / timelineData.length).toFixed(1)}</h2>
					<h5>Average Points/Hit</h5>
				</div>
				<div class="metric-card">
					
					<h2>${Math.max(...timelineData.map(hit => hit.points))}</h2>
					<h5>Max Hit Value</h5>
				</div>
				<div class="metric-card">
					
					<h2>${Math.max(...timelineData.map(hit => hit.time)).toFixed(1)}s</h2>
					<h5>Game Duration</h5>
				</div>
			</div>
		`;
		container.appendChild(detailsDiv);
	}

	onWindowResize(e) {
		//const width = Math.max(document.body.clientWidth, 1000) - this.margin.left - this.margin.right;
		//this.initWidth = width
		this.onTimeZoom()
	}

	onTimeZoom(e) {
		let val = document.getElementById("timelineRangeSlider").value / 100
		let maxScale = this.initWidth * 10
		//this.getContainerD3().select("svg").attr("width", (val*maxScale + (1-val)*this.initWidth))
	}
}