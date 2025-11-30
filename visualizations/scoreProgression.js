class LaserTagScoreProgression extends LaserTagVisualizations {
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
            .style('background', '#f8f9fa')
            .style('border-radius', '8px');

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
            .attr('fill', '#2c3e50')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Game Time');

        g.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -50)
            .attr('x', -chartHeight / 2)
            .attr('fill', '#2c3e50')
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
                .attr('fill', '#2c3e50')
                .style('font-size', '12px')
                .text(`Player ${playerId}`);
        });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('fill', '#2c3e50')
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
        const playerStats = {};
        const uniquePlayers = [...new Set(scoreEvents.map(e => e.data?.ID))].filter(id => id !== undefined);
        
        uniquePlayers.forEach(playerId => {
            const playerEvents = scoreEvents.filter(e => e.data?.ID === playerId);
            const scores = playerEvents.map(e => e.data?.newScore || 0);
            const scoreChanges = playerEvents.map(e => (e.data?.newScore || 0) - (e.data?.oldScore || 0));
            const positiveChanges = scoreChanges.filter(change => change > 0);
            const negativeChanges = scoreChanges.filter(change => change < 0);
            
            playerStats[playerId] = {
                totalEvents: playerEvents.length,
                finalScore: Math.max(...scores),
                totalPositivePoints: positiveChanges.reduce((sum, change) => sum + change, 0),
                totalNegativePoints: Math.abs(negativeChanges.reduce((sum, change) => sum + change, 0)),
                averageScoreChange: scoreChanges.reduce((sum, change) => sum + change, 0) / scoreChanges.length,
                largestGain: Math.max(...scoreChanges, 0),
                largestLoss: Math.min(...scoreChanges, 0),
                positiveEvents: positiveChanges.length,
                negativeEvents: negativeChanges.length,
                firstScoreTime: Math.min(...playerEvents.map(e => e.matchState?.gameTime || 0)),
                lastScoreTime: Math.max(...playerEvents.map(e => e.matchState?.gameTime || 0))
            };
        });

        // Create analysis container
        const analysisContainer = document.createElement('div');
        analysisContainer.style.cssText = `
            max-height: 500px;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 8px;
        `;

        // Overall statistics
        const overallStats = document.createElement('div');
        overallStats.style.cssText = 'margin-bottom: 30px;';
        
        const totalScoreEvents = scoreEvents.length;
        const totalPlayers = uniquePlayers.length;
        const matchDuration = Math.max(...scoreEvents.map(e => e.matchState?.gameTime || 0));
        const averageEventsPerMinute = totalScoreEvents / (matchDuration / 60);

        overallStats.innerHTML = `
            <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #3498db; padding-bottom: 8px;">Match Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${totalScoreEvents}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Total Score Events</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #27ae60;">${totalPlayers}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Active Players</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #e74c3c;">${matchDuration.toFixed(1)}s</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Match Duration</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #9b59b6;">${averageEventsPerMinute.toFixed(1)}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Events/Min</div>
                </div>
            </div>
        `;

        // Player-specific statistics
        const playerStatsContainer = document.createElement('div');
        playerStatsContainer.innerHTML = '<h3 style="color: #2c3e50; margin: 30px 0 15px 0; border-bottom: 2px solid #3498db; padding-bottom: 8px;">Player Performance</h3>';

        uniquePlayers.forEach(playerId => {
            const stats = playerStats[playerId];
            const playerCard = document.createElement('div');
            playerCard.style.cssText = `
                background: white;
                margin: 15px 0;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border-left: 5px solid #3498db;
            `;

            const efficiency = stats.positiveEvents / (stats.positiveEvents + stats.negativeEvents) * 100;
            const scoreVelocity = stats.finalScore / ((stats.lastScoreTime - stats.firstScoreTime) / 60); // points per minute

            playerCard.innerHTML = `
                <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 1.3em;">Player ${playerId}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #27ae60;">${stats.finalScore}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Final Score</div>
                    </div>
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #3498db;">${stats.totalEvents}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Score Events</div>
                    </div>
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #f39c12;">${stats.averageScoreChange.toFixed(1)}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Avg Change</div>
                    </div>
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: ${efficiency >= 70 ? '#27ae60' : efficiency >= 50 ? '#f39c12' : '#e74c3c'};">${efficiency.toFixed(1)}%</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Efficiency</div>
                    </div>
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #9b59b6;">${scoreVelocity.toFixed(1)}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Points/Min</div>
                    </div>
                    <div>
                        <div style="font-size: 1.2em; font-weight: bold; color: #e74c3c;">${Math.abs(stats.largestLoss)}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Largest Loss</div>
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-size: 0.9em; color: #34495e;">
                        <span style="color: #27ae60;">+${stats.totalPositivePoints}</span> earned • 
                        <span style="color: #e74c3c;">-${stats.totalNegativePoints}</span> lost • 
                        Best gain: <span style="color: #27ae60;">+${stats.largestGain}</span>
                    </div>
                </div>
            `;

            playerStatsContainer.appendChild(playerCard);
        });

        analysisContainer.appendChild(overallStats);
        analysisContainer.appendChild(playerStatsContainer);
        container.appendChild(analysisContainer);
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
                <div class="stat-card">
                    <h4>Total Points</h4>
                    <span>${timelineData.reduce((sum, hit) => sum + hit.points, 0)}</span>
                </div>
                <div class="stat-card">
                    <h4>Average Points/Hit</h4>
                    <span>${(timelineData.reduce((sum, hit) => sum + hit.points, 0) / timelineData.length).toFixed(1)}</span>
                </div>
                <div class="stat-card">
                    <h4>Max Hit Value</h4>
                    <span>${Math.max(...timelineData.map(hit => hit.points))}</span>
                </div>
                <div class="stat-card">
                    <h4>Game Duration</h4>
                    <span>${Math.max(...timelineData.map(hit => hit.time)).toFixed(1)}s</span>
                </div>
            </div>
        `;
        container.appendChild(detailsDiv);
    }

	/**
     * Create score progression visualization showing PlayerScore events
     */
    loadData(processor) {
		const events = processor.events;
        const container = this.getContainer();
        container.innerHTML = '';

        // Filter for PlayerScore events
        const scoreEvents = events.filter(event => event.eventName === "PlayerScore");
        
        if (scoreEvents.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No score events found</p>';
            return;
        }

        // Sort events by game time
        scoreEvents.sort((a, b) => (a.matchState?.gameTime || 0) - (b.matchState?.gameTime || 0));

        // Create the score progression list
        const progressionContainer = document.createElement('div');
        progressionContainer.style.cssText = 'max-height: 400px; overflow-y: auto; padding: 15px;';

        const title = document.createElement('h3');
        title.textContent = `Score Progression (${scoreEvents.length} events)`;
        title.style.cssText = 'margin: 0 0 15px 0; color: #2c3e50; text-align: center;';
        progressionContainer.appendChild(title);

        scoreEvents.forEach((event, index) => {
            const eventItem = document.createElement('div');
            eventItem.style.cssText = `
                background: linear-gradient(135deg, rgba(52, 152, 219, 0.1), rgba(155, 89, 182, 0.1));
                border-left: 4px solid #3498db;
                margin: 8px 0;
                padding: 12px 15px;
                border-radius: 8px;
                transition: all 0.3s ease;
                position: relative;
            `;

            // Add hover effect
            eventItem.addEventListener('mouseenter', () => {
                eventItem.style.transform = 'translateX(5px)';
                eventItem.style.boxShadow = '0 4px 15px rgba(52, 152, 219, 0.2)';
            });
            eventItem.addEventListener('mouseleave', () => {
                eventItem.style.transform = 'translateX(0)';
                eventItem.style.boxShadow = 'none';
            });

            const eventData = event.data || {};
            const matchState = event.matchState || {};
            
            // Extract player info
            const playerId = eventData.ID || 'Unknown';
            const oldScore = eventData.oldScore || 0;
            const newScore = eventData.newScore || 0;
            const scoreDiff = newScore - oldScore;
            const hitId = eventData.HitID !== undefined ? eventData.HitID : '';
            const gameTime = matchState.gameTime || 0;
            const roundTime = matchState.roundTime || 0;

            // Create event header
            const eventHeader = document.createElement('div');
            eventHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

            const playerInfo = document.createElement('span');
            playerInfo.textContent = `Player ${playerId}`;
            playerInfo.style.cssText = 'font-weight: bold; color: #2c3e50; font-size: 1.1em;';

            const timeInfo = document.createElement('span');
            timeInfo.textContent = `${gameTime.toFixed(1)}s`;
            timeInfo.style.cssText = 'color: #7f8c8d; font-size: 0.9em;';

            eventHeader.appendChild(playerInfo);
            eventHeader.appendChild(timeInfo);

            // Create score details
            const scoreDetails = document.createElement('div');
            scoreDetails.style.cssText = 'display: flex; justify-content: space-between; align-items: center;';

            const scoreChange = document.createElement('div');
            const scoreColor = scoreDiff > 0 ? '#27ae60' : scoreDiff < 0 ? '#e74c3c' : '#7f8c8d';
            const scoreSymbol = scoreDiff > 0 ? '+' : '';
            scoreChange.innerHTML = `
                <span style="color: #34495e;">${oldScore} → </span>
                <span style="color: ${scoreColor}; font-weight: bold;">${newScore}</span>
                <span style="color: ${scoreColor}; margin-left: 8px;">(${scoreSymbol}${scoreDiff})</span>
            `;

            const hitInfo = document.createElement('span');
            if (hitId !== '') {
                hitInfo.textContent = `Hit #${hitId}`;
                hitInfo.style.cssText = 'background: rgba(52, 152, 219, 0.2); padding: 2px 8px; border-radius: 12px; font-size: 0.8em; color: #2980b9;';
            }

            scoreDetails.appendChild(scoreChange);
            if (hitInfo.textContent) {
                scoreDetails.appendChild(hitInfo);
            }

            // Add round info if different from game time
            if (Math.abs(roundTime - gameTime) > 0.1) {
                const roundInfo = document.createElement('div');
                roundInfo.textContent = `Round time: ${roundTime.toFixed(1)}s`;
                roundInfo.style.cssText = 'font-size: 0.8em; color: #95a5a6; margin-top: 4px;';
                eventItem.appendChild(roundInfo);
            }

            eventItem.appendChild(eventHeader);
            eventItem.appendChild(scoreDetails);

            progressionContainer.appendChild(eventItem);
        });

        // Add summary at the bottom
        const summary = document.createElement('div');
        summary.style.cssText = `
            background: rgba(52, 152, 219, 0.1);
            border-radius: 8px;
            padding: 12px;
            margin-top: 15px;
            text-align: center;
            border: 1px solid rgba(52, 152, 219, 0.3);
        `;

        const uniquePlayers = [...new Set(scoreEvents.map(e => e.data?.ID))].filter(id => id !== undefined);
        const totalScoreChanges = scoreEvents.reduce((sum, e) => sum + Math.abs((e.data?.newScore || 0) - (e.data?.oldScore || 0)), 0);
        
        summary.innerHTML = `
            <strong style="color: #2c3e50;">Summary:</strong><br>
            <span style="color: #7f8c8d;">
                ${uniquePlayers.length} players • ${scoreEvents.length} score events • ${totalScoreChanges} total points awarded
            </span>
        `;

        progressionContainer.appendChild(summary);
        container.appendChild(progressionContainer);

        // Add click handler for fullscreen
        progressionContainer.style.cursor = 'pointer';
        progressionContainer.addEventListener('click', () => {
            this.openFullscreen('score', events, 'Score Progression - Detailed Analysis');
        });

        // Add fullscreen indicator
        const fullscreenBtn = document.createElement('div');
        fullscreenBtn.innerHTML = '🔍 View Details';
        fullscreenBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(52, 152, 219, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 12px;
        `;
        container.style.position = 'relative';
        container.appendChild(fullscreenBtn);
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
}