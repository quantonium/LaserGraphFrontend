/**
 * Visualization Module for Laser Tag Analytics
 * Creates and manages various data visualizations
 */

class LaserTagVisualizations {
    constructor() {
        this.charts = {};
    }

    /**
     * Create hexagon radar chart using Chart.js
     */
    createHexagonChart(metricsInfo) {
        const ctx = document.getElementById('hexChart').getContext('2d');
        
        // Destroy existing chart if it exists
        if (this.charts.hexChart) {
            this.charts.hexChart.destroy();
        }

        const data = {
            labels: [
                'Trickshot',
                'Stealth', 
                'Speed',
                'RPM',
                'Range',
                'Accuracy'
            ],
            datasets: [{
                label: 'Player Performance',
                data: [
                    metricsInfo.trickshot.normalized,
                    metricsInfo.stealth.normalized,
                    metricsInfo.speed.normalized,
                    metricsInfo.rpm.normalized,
                    metricsInfo.range.normalized,
                    metricsInfo.accuracy.normalized
                ],
                backgroundColor: 'rgba(52, 152, 219, 0.2)',
                borderColor: 'rgba(52, 152, 219, 1)',
                borderWidth: 3,
                pointBackgroundColor: [
                    '#e74c3c', // Trickshot
                    '#9b59b6', // Stealth
                    '#f39c12', // Speed
                    '#e67e22', // RPM
                    '#2ecc71', // Range
                    '#1abc9c'  // Accuracy
                ],
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        };

        const options = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: true,
                    text: 'Performance Radar Chart',
                    font: {
                        size: 16,
                        weight: 'bold'
                    },
                    color: '#2c3e50'
                },
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const metricNames = ['trickshot', 'stealth', 'speed', 'rpm', 'range', 'accuracy'];
                            const metricName = metricNames[context.dataIndex];
                            const metricInfo = metricsInfo[metricName];
                            return `${context.label}: ${metricInfo.value}${metricInfo.unit} (${context.parsed.r.toFixed(1)}/100)`;
                        }
                    }
                }
            },
            scales: {
                r: {
                    beginAtZero: true,
                    max: 100,
                    min: 0,
                    ticks: {
                        stepSize: 20,
                        color: '#7f8c8d',
                        backdropColor: 'transparent'
                    },
                    grid: {
                        color: 'rgba(127, 140, 141, 0.3)'
                    },
                    angleLines: {
                        color: 'rgba(127, 140, 141, 0.3)'
                    },
                    pointLabels: {
                        font: {
                            size: 12,
                            weight: 'bold'
                        },
                        color: '#2c3e50'
                    }
                }
            },
            elements: {
                line: {
                    tension: 0.2
                }
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutQuart'
            }
        };

        this.charts.hexChart = new Chart(ctx, {
            type: 'radar',
            data: data,
            options: options
        });
    }

    /**
     * Create timeline chart showing hits over time
     */
    createTimelineChart(hits) {
        const container = document.getElementById('timelineChart');
        container.innerHTML = ''; // Clear existing content

        // Simple timeline using D3.js
        const margin = { top: 20, right: 30, bottom: 40, left: 50 };
        const width = container.offsetWidth - margin.left - margin.right;
        const height = 300 - margin.top - margin.bottom;

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
            index: index
        })).sort((a, b) => a.time - b.time);

        if (timelineData.length === 0) return;

        // Scales
        const xScale = d3.scaleLinear()
            .domain(d3.extent(timelineData, d => d.time))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(timelineData, d => d.points)])
            .range([height, 0]);

        // Axes
        g.append('g')
            .attr('transform', `translate(0,${height})`)
            .call(d3.axisBottom(xScale))
            .append('text')
            .attr('x', width / 2)
            .attr('y', 35)
            .attr('fill', '#2c3e50')
            .style('text-anchor', 'middle')
            .text('Time (seconds)');

        g.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -35)
            .attr('x', -height / 2)
            .attr('fill', '#2c3e50')
            .style('text-anchor', 'middle')
            .text('Points');

        // Line
        const line = d3.line()
            .x(d => xScale(d.time))
            .y(d => yScale(d.points))
            .curve(d3.curveMonotoneX);

        g.append('path')
            .datum(timelineData)
            .attr('fill', 'none')
            .attr('stroke', '#3498db')
            .attr('stroke-width', 2)
            .attr('d', line);

        // Points
        g.selectAll('.dot')
            .data(timelineData)
            .enter().append('circle')
            .attr('class', 'dot')
            .attr('cx', d => xScale(d.time))
            .attr('cy', d => yScale(d.points))
            .attr('r', 4)
            .attr('fill', '#e74c3c')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('r', 6);
                // Add tooltip logic here
            })
            .on('mouseout', function() {
                d3.select(this).attr('r', 4);
            });
    }

    /**
     * Create score progression visualization showing PlayerScore events
     */
    createScoreChart(events) {
        const container = document.getElementById('scoreChart');
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
    }

    /**
     * Create target distribution chart
     */
    createTargetChart(hits) {
        const container = document.getElementById('targetChart');
        
        // Count different target types from the new data structure
        const targetCounts = {};
        hits.forEach(hit => {
            if (hit.hitComponent) {
                const component = hit.hitComponent;
                let targetType = 'Unknown';
                
                if (component.includes('Sensor_Rectangle')) {
                    targetType = 'Rectangle Sensor';
                } else if (component.includes('Sensor_')) {
                    // Extract sensor number for more specific targeting
                    const sensorMatch = component.match(/Sensor_(\d+)/);
                    if (sensorMatch) {
                        targetType = `Sensor ${sensorMatch[1]}`;
                    } else {
                        targetType = 'Round Sensor';
                    }
                }
                
                targetCounts[targetType] = (targetCounts[targetType] || 0) + 1;
            }
        });

        // Create simple bar chart representation
        container.innerHTML = '';
        const targetTypes = Object.keys(targetCounts);
        
        if (targetTypes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No target data available</p>';
            return;
        }

        const maxCount = Math.max(...Object.values(targetCounts));
        
        targetTypes.forEach(type => {
            const count = targetCounts[type];
            const percentage = (count / maxCount) * 100;
            
            const barContainer = document.createElement('div');
            barContainer.style.cssText = 'margin: 10px 0; padding: 10px;';
            
            const label = document.createElement('div');
            label.textContent = `${type}: ${count} hits`;
            label.style.cssText = 'font-weight: bold; margin-bottom: 5px; color: #2c3e50;';
            
            const bar = document.createElement('div');
            bar.style.cssText = `
                background: linear-gradient(90deg, #3498db, #2ecc71);
                height: 20px;
                width: ${percentage}%;
                border-radius: 10px;
                transition: width 0.5s ease;
            `;
            
            barContainer.appendChild(label);
            barContainer.appendChild(bar);
            container.appendChild(barContainer);
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

    /**
     * Update all visualizations with new data
     */
    updateAll(processor) {
        const metricsInfo = processor.getMetricsInfo();
        
        this.createHexagonChart(metricsInfo);
        this.createTimelineChart(processor.hits);
        this.createScoreChart(processor.events); // Use score progression chart
        this.createTargetChart(processor.hits);
    }
}

// Export for use in other modules
window.LaserTagVisualizations = LaserTagVisualizations;
