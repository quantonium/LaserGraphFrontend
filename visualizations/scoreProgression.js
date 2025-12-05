class LaserTagScoreProgression extends LaserTagVisualizations {
	processor = null
	/**
	 * Create fullscreen score progression
	 */
	createFullscreen(events, container, detailsContainer) {
		// Filter for PlayerScore events
		const scoreEvents = events.filter(event => event.eventName === "PlayerScore");
		
		if (scoreEvents.length === 0) {
			container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px; font-size: 1.2em;">No score events found in this match</p>';
			detailsContainer.innerHTML = '';
			return;
		}

		// Sort events by game time
		scoreEvents.sort((a, b) => (a.matchState?.gameTime || 0) - (b.matchState?.gameTime || 0));

		// Create enhanced visualization
		this.createEnhancedScoreChart(scoreEvents, container);
		this.createDetailedScoreAnalysis(scoreEvents, detailsContainer);
	}

	/**
	 * Create enhanced score chart with timeline visualization
	 */
	createEnhancedScoreChart(scoreEvents, container) {
		const width = 800;
		const height = 500;
		const margin = { top: 40, right: 60, bottom: 60, left: 80 };
		const chartWidth = width - margin.left - margin.right;
		const chartHeight = height - margin.top - margin.bottom;

		// Clear container
		container.innerHTML = '';

		// Create SVG
		const svg = d3.select(container)
			.append('svg')
			.attr('width', width)
			.attr('height', height)

		const g = svg.append('g')
			.attr('transform', `translate(${margin.left},${margin.top})`);

		// Process data for visualization
		const playerData = {};
		scoreEvents.forEach(event => {
			const playerId = event.data?.ID || 'Unknown';
			const gameTime = event.matchState?.gameTime || 0;
			const newScore = event.data?.newScore || 0;
			
			if (!playerData[playerId]) {
				playerData[playerId] = [];
			}
			playerData[playerId].push({
				time: gameTime,
				score: newScore,
				event: event
			});
		});

		// Create scales
		const maxTime = Math.max(...scoreEvents.map(e => e.matchState?.gameTime || 0));
		const maxScore = Math.max(...scoreEvents.map(e => e.data?.newScore || 0));
		
		const xScale = d3.scaleLinear()
			.domain([0, maxTime])
			.range([0, chartWidth]);

		const yScale = d3.scaleLinear()
			.domain([0, maxScore * 1.1])
			.range([chartHeight, 0]);

		// Color scale for players
		const playerIds = Object.keys(playerData);
		const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
			.domain(playerIds);

		// Add axes
		g.append('g')
			.attr('transform', `translate(0,${chartHeight})`)
			.call(d3.axisBottom(xScale)
				.tickFormat(d => `${d.toFixed(1)}s`))
			.append('text')
			.attr('x', chartWidth / 2)
			.attr('y', 40)
			.attr('fill', '#aaa')
			.style('text-anchor', 'middle')
			.style('font-weight', 'bold')
			.text('Game Time');

		g.append('g')
			.call(d3.axisLeft(yScale))
			.append('text')
			.attr('transform', 'rotate(-90)')
			.attr('y', -50)
			.attr('x', -chartHeight / 2)
			.attr('fill', '#aaa')
			.style('text-anchor', 'middle')
			.style('font-weight', 'bold')
			.text('Score');

		// Create line generator
		const line = d3.line()
			.x(d => xScale(d.time))
			.y(d => yScale(d.score))
			.curve(d3.curveMonotoneX);

		// Draw lines for each player
		playerIds.forEach(playerId => {
			const data = playerData[playerId];
			
			// Add line
			g.append('path')
				.datum(data)
				.attr('fill', 'none')
				.attr('stroke', colorScale(playerId))
				.attr('stroke-width', 3)
				.attr('stroke-opacity', 0.8)
				.attr('d', line);

			// Add points
			g.selectAll(`.point-${playerId}`)
				.data(data)
				.enter()
				.append('circle')
				.attr('class', `point-${playerId}`)
				.attr('cx', d => xScale(d.time))
				.attr('cy', d => yScale(d.score))
				.attr('r', 4)
				.attr('fill', colorScale(playerId))
				.attr('stroke', '#fff')
				.attr('stroke-width', 2)
				.style('cursor', 'pointer')
				.on('mouseover', function(event, d) {
					// Tooltip
					const tooltip = d3.select('body')
						.append('div')
						.attr('class', 'score-tooltip')
						.style('position', 'absolute')
						.style('background', 'rgba(0,0,0,0.8)')
						.style('color', 'white')
						.style('padding', '8px')
						.style('border-radius', '4px')
						.style('font-size', '12px')
						.style('pointer-events', 'none')
						.style('opacity', 0);

					tooltip.transition()
						.duration(200)
						.style('opacity', 1);

					const scoreDiff = d.event.data?.newScore - d.event.data?.oldScore || 0;
					const symbol = scoreDiff > 0 ? '+' : '';
					
					tooltip.html(`
						<strong>Player ${playerId}</strong><br>
						Time: ${d.time.toFixed(1)}s<br>
						Score: ${d.score}<br>
						Change: ${symbol}${scoreDiff}<br>
						${d.event.data?.HitID !== undefined ? `Hit #${d.event.data.HitID}` : ''}
					`)
						.style('left', (event.pageX + 10) + 'px')
						.style('top', (event.pageY - 10) + 'px');

					d3.select(this)
						.attr('r', 6)
						.attr('stroke-width', 3);
				})
				.on('mouseout', function() {
					d3.selectAll('.score-tooltip').remove();
					d3.select(this)
						.attr('r', 4)
						.attr('stroke-width', 2);
				});
		});

		// Add legend
		const legend = g.append('g')
			.attr('transform', `translate(${chartWidth - 100}, 20)`);

		playerIds.forEach((playerId, i) => {
			const legendItem = legend.append('g')
				.attr('transform', `translate(0, ${i * 20})`);

			legendItem.append('circle')
				.attr('r', 6)
				.attr('fill', colorScale(playerId));

			legendItem.append('text')
				.attr('x', 15)
				.attr('dy', '0.35em')
				.attr('fill', '#fff')
				.style('font-size', '12px')
				.text(`Player ${playerId}`);
		});

		// Add title
		svg.append('text')
			.attr('x', width / 2)
			.attr('y', 25)
			.attr('fill', '#fff')
			.style('text-anchor', 'middle')
			.style('font-size', '18px')
			.style('font-weight', 'bold')
			.text('Score Progression Timeline');
	}

	/**
	 * Create detailed score analysis
	 */
	createDetailedScoreAnalysis(scoreEvents, container) {
		container.innerHTML = '';

		// Calculate statistics
		const uniquePlayers = [...new Set(scoreEvents.map(e => e.data?.ID))].filter(id => id !== undefined);

		// Overall statistics
		const overallStats = container;
		
		const totalScoreEvents = scoreEvents.length;
		const totalPlayers = uniquePlayers.length;
		const matchDuration = Math.max(...scoreEvents.map(e => e.matchState?.gameTime || 0));
		const averageEventsPerMinute = totalScoreEvents / (matchDuration / 60);
		const maxScoreDelta = Math.max(...scoreEvents.map(e => e.data?.newScore - e.data?.oldScore))
		const maxBounce = Math.max(...this.processor.hits.map(e => e.pointMultiplier))
		const maxDist = Math.max(...this.processor.hits.map(e => e.distance))

		overallStats.innerHTML = `
			<h3>Match Overview</h3>
			<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #3498db;">${totalScoreEvents}</h2>
					<h5>Total Score Events</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #27ae60;">${totalPlayers}</h2>
					<h5>Active Players</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #e74c3c;">${matchDuration.toFixed(1)}s</h2>
					<h5>Match Duration</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #9b59b6;">${averageEventsPerMinute.toFixed(1)}</h2>
					<h5>Events/Min</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #b700ffff;">${maxScoreDelta}</h2>
					<h5>Max Score Change</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #b700ffff;">${maxBounce}</h2>
					<h5>Max Bounce Multiplier</h5>
				</div>
				<div style="box-shadow: 0 2px 4px rgba(0,0,0,0.1);" class="metric-card">
					<h2 style="font-weight: bold; color: #b700ffff;">${maxDist}</h2>
					<h5>Max Distance</h5>
				</div>
			</div>
		`;
	}

	/**
	 * Create score progression visualization showing PlayerScore events
	 */
	loadData(processor) {
		this.processor = processor
		const events = processor.events;
		const container = this.getContainer();
		container.innerHTML = '';

		// Filter for PlayerScore events
		const scoreEvents = events.filter(event => event.eventName === "PlayerScore");
		
		const summ = document.createElement("div")
		summ.style.display = "flex"
		summ.style.flexDirection = "row"
		summ.style.justifyContent = "space-around"
		summ.style.flex = "0 1 auto"
		if (scoreEvents.length === 0) {
			summ.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No score events found</p>';
			return;
		}

		// Sort events by game time
		scoreEvents.sort((a, b) => (a.matchState?.gameTime || 0) - (b.matchState?.gameTime || 0));

		// Create the score progression list
		const scrollContainer = document.createElement("div");
		scrollContainer.className = "score-progression-scroll"

		const progressionContainer = document.createElement('table');
		progressionContainer.className = 'score-progression-container';

		/**const title = document.createElement('h3');
		title.textContent = `${scoreEvents.length} events`;
		title.style.cssText = 'margin: 0 0 15px 0; text-align: center;';
		container.appendChild(title);**/

		scoreEvents.forEach((event, index) => {
			

			const eventData = event.data || {};
			const matchState = event.matchState || {};
			
			// Extract player info
			const playerId = eventData.ID;
			const oldScore = eventData.oldScore || 0;
			const newScore = eventData.newScore || 0;
			const scoreDiff = newScore - oldScore;
			const hitId = eventData.HitID !== undefined ? eventData.HitID : '';
			const gameTime = matchState.gameTime || 0;
			const roundTime = matchState.roundTime || 0;

			let colors = this.processor.getColors(playerId, gameTime)
			const primary = LaserTagDataProcessor.convertColor(colors.primary)
			const secondary = LaserTagDataProcessor.convertColor(colors.secondary)

			const eventItem = document.createElement('tr');
			eventItem.className = 'timeline-sync-indicator';
			eventItem.dataset.eventTime = event.matchState?.gameTime || 0;
			eventItem.style.cssText = `
				
				margin: 8px 0;
				padding: 12px 15px;
				border-radius: 8px;
				transition: all 0.3s ease;
				outline: 1px solid #000;
			`;

			// Add hover effect
			eventItem.addEventListener('mouseenter', () => {
				eventItem.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.2)';
			});
			eventItem.addEventListener('mouseleave', () => {
				eventItem.style.boxShadow = 'none';
			});

			// Create event header
			const eventHeader = document.createElement('td');
			const playerInfo = document.createElement('h3');
			playerInfo.textContent = `${processor.playerData[playerId].playerName}`;
			playerInfo.className = "noanim"
			playerInfo.style.cssText = `font-weight: bold; color: ${secondary};`;

			const timeInfo = document.createElement('span');
			timeInfo.textContent = `${gameTime.toFixed(1)}s`;
			timeInfo.style.cssText = 'color: #7f8c8d; font-size: 0.9em;';

			eventHeader.appendChild(playerInfo);
			eventHeader.appendChild(timeInfo);

			

			// Create score details
			const scoreOrig = document.createElement('td');
			const arrow = document.createElement('td');
			const scoreNew = document.createElement('td');

			const scoreColor = scoreDiff > 0 ? '#27ae60' : scoreDiff < 0 ? '#e74c3c' : '#7f8c8d';
			const scoreSymbol = scoreDiff > 0 ? '+' : '';


			scoreOrig.innerHTML = `<span style="color: #34495e;">${oldScore}</span>`
			scoreOrig.style.textAlign = "right"
			arrow.innerHTML = `<span style="color: #34495e;">→</span>`
			arrow.style.textAlign = "center"
			scoreNew.innerHTML = `<span style="color: ${scoreColor}; font-weight: bold;">${newScore}</span><span style="color: ${scoreColor}; margin-left: 8px;">(${scoreSymbol}${scoreDiff})</span>`

			const hitCol = document.createElement('td')
			hitCol.style.textAlign = "right"

			// Add round info if different from game time
			if (Math.abs(roundTime - gameTime) > 0.1) {
				const roundInfo = document.createElement('div');
				roundInfo.textContent = `Round time: ${roundTime.toFixed(1)}s`;
				roundInfo.style.cssText = 'font-size: 0.8em; color: #95a5a6; margin-top: 4px;';
				roundInfo.style.textAlign = "left"
				hitCol.appendChild(roundInfo);
			}

			/*if (hitId !== '') {
				const hitInfo = document.createElement('span');
				
				hitInfo.textContent = `Hit #${hitId}`;
				hitInfo.style.cssText = "color: #616161ff;"
				hitInfo.style.textAlign = "right"
				//hitInfo.style.cssText = 'background: rgba(52, 152, 219, 0.2); padding: 2px 8px; border-radius: 12px; font-size: 0.8em; color: #2980b9;';
				hitCol.appendChild(hitInfo)
			}*/

			eventItem.appendChild(eventHeader);
			eventItem.appendChild(scoreOrig);
			eventItem.appendChild(arrow);
			eventItem.appendChild(scoreNew);
			eventItem.appendChild(hitCol);

			progressionContainer.appendChild(eventItem);
		});
		// Add summary at the top
		const summary = document.createElement('p');
		summary.style.textAlign = "center";
		/*summary.style.cssText = `
			background: rgba(52, 152, 219, 0.1);
			border-radius: 8px;
			padding: 12px;
			margin-top: 15px;
			text-align: center;
			border: 1px solid rgba(52, 152, 219, 0.3);
		`;*/

		const uniquePlayers = [...new Set(scoreEvents.map(e => e.data?.ID))].filter(id => id !== undefined);
		const totalScoreChanges = scoreEvents.reduce((sum, e) => sum + Math.abs((e.data?.newScore || 0) - (e.data?.oldScore || 0)), 0);
		
		summary.innerText = `${uniquePlayers.length} players • ${scoreEvents.length} score events • ${totalScoreChanges} total points awarded`;

		summ.appendChild(summary);
		

		// Add scroll synchronization with hit timeline
		this.setupTimelineSync(scrollContainer, scoreEvents);

		

		// Add fullscreen indicator
		const fullscreenBtn = document.createElement('button');
		fullscreenBtn.className = "noprint"
		fullscreenBtn.innerText = '🔍 View Details';
		// Add click handler for fullscreen
		fullscreenBtn.addEventListener('click', () => {
			this.openFullscreen('score', events, 'Score Progression - Detailed Analysis');
		});
		summ.appendChild(fullscreenBtn);
		container.appendChild(summ);

		scrollContainer.appendChild(progressionContainer);
		container.appendChild(scrollContainer);
	}

	/**
	 * Setup timeline synchronization based on scroll position
	 */
	setupTimelineSync(progressionContainer, scoreEvents) {
		let scrollTimeout;
		
		progressionContainer.addEventListener('scroll', () => {
			clearTimeout(scrollTimeout);
			scrollTimeout = setTimeout(() => {
				this.updateTimelineFromScroll(progressionContainer, scoreEvents);
			}, 100); // Debounce scroll events
		});
		
		// Initial sync
		this.updateTimelineFromScroll(progressionContainer, scoreEvents);
	}

	/**
	 * Update hit timeline based on score progression scroll position
	 */
	updateTimelineFromScroll(progressionContainer, scoreEvents) {
		const scrollTop = progressionContainer.scrollTop;
		const scrollHeight = progressionContainer.scrollHeight - progressionContainer.clientHeight;
		const scrollPercent = scrollHeight > 0 ? scrollTop / scrollHeight : 0;
		
		// Calculate visible time range based on scroll position
		const totalTime = Math.max(...scoreEvents.map(e => e.matchState?.gameTime || 0));
		const timeWindow = totalTime * 0.2; // Show 20% of total time in the window
		const centerTime = scrollPercent * totalTime;
		const startTime = Math.max(0, centerTime - timeWindow / 2);
		const endTime = Math.min(totalTime, centerTime + timeWindow / 2);
		
		// Find the corresponding hit timeline and update it
		const appInstance = window.laserTagApp;
		if (appInstance) {
			appInstance.updateTimeRange(startTime, endTime)
		}
		
		// Dispatch custom event for other components that might want to listen
		const event = new CustomEvent('scoreProgressionScroll', {
			detail: {
				scrollPercent,
				startTime,
				endTime,
				centerTime,
				totalTime
			}
		});
		document.dispatchEvent(event);
	}

	/**
	 * Update visual indicators in score progression based on focused time range
	 */
	updateScoreProgressionIndicators(startTime, endTime) {
		const container = this.getContainer();
		const indicators = container.querySelectorAll('.timeline-sync-indicator');
		
		indicators.forEach(indicator => {
			const eventTime = parseFloat(indicator.dataset.eventTime);
			const isInRange = eventTime >= startTime && eventTime <= endTime;
			
			if (isInRange) {
				indicator.classList.add('active');
			} else {
				indicator.classList.remove('active');
			}
		});
	}

	/**
	 * Create team performance chart
	 */
	createTeamChart(teamData) {
		const container = document.getElementById('scoreChart');
		container.innerHTML = '';

		console.log('Team data received:', teamData);

		const teams = Object.values(teamData);
		const activeTeams = teams.filter(team => team.hits > 0 || team.points > 0);
		
		if (activeTeams.length === 0) {
			container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No active team data available</p>';
			return;
		}

		// Create team comparison chart
		const chartContainer = document.createElement('div');
		chartContainer.style.cssText = 'padding: 20px;';

		activeTeams.forEach((team, index) => {
			const teamContainer = document.createElement('div');
			teamContainer.style.cssText = 'margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 10px;';
			
			const teamHeader = document.createElement('div');
			teamHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;';
			
			const teamName = document.createElement('h3');
			teamName.textContent = team.name || `Team ${index + 1}`;
			const color = team.color || { r: 0.5, g: 0.5, b: 0.5 }; // Default gray if no color
			teamName.style.cssText = `color: rgb(${color.r * 255}, ${color.g * 255}, ${color.b * 255}); margin: 0;`;
			
			const teamScore = document.createElement('span');
			teamScore.textContent = `${team.points || 0} points`;
			teamScore.style.cssText = 'font-size: 1.2em; font-weight: bold; color: #2c3e50;';
			
			teamHeader.appendChild(teamName);
			teamHeader.appendChild(teamScore);
			
			const teamStats = document.createElement('div');
			teamStats.innerHTML = `
				<div style="font-size: 0.9em; color: #7f8c8d;">
					Hits: ${team.hits || 0} | Avg Range: ${(team.avgRange || 0).toFixed(0)} units
				</div>
			`;
			
			teamContainer.appendChild(teamHeader);
			teamContainer.appendChild(teamStats);
			chartContainer.appendChild(teamContainer);
		});

		container.appendChild(chartContainer);
	}

	highlightTimeRange(startTime = 0, endTime = -1) {
		// Update score progression visual indicators
		this.updateScoreProgressionIndicators(startTime, endTime);
	}
}