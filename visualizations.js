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
     * Create simple score progression chart
     */
    createScoreChart(events) {
        const container = document.getElementById('scoreChart');
        container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">Score progression visualization will be implemented here</p>';
        
        // Filter score events
        const scoreEvents = events.filter(event => 
            event.eventName === 'PlayerScore' || event.eventName === 'TeamPointsChange'
        );

        if (scoreEvents.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No score data available</p>';
            return;
        }

        // Simple implementation - could be expanded
        container.innerHTML = `<p style="text-align: center; color: #2c3e50; padding: 20px;">Found ${scoreEvents.length} score events</p>`;
    }

    /**
     * Create target distribution chart
     */
    createTargetChart(hits) {
        const container = document.getElementById('targetChart');
        
        // Count different target types
        const targetCounts = {};
        hits.forEach(hit => {
            if (hit.hitComponent) {
                const component = hit.hitComponent;
                let targetType = 'Unknown';
                
                if (component.includes('Sensor_Reflective_Big_DemoDay_NotReflective_C')) {
                    targetType = 'Non-Reflective Sensor';
                } else if (component.includes('Sensor_Reflective_Big_DemoDay_C')) {
                    targetType = 'Reflective Sensor (Big)';
                } else if (component.includes('Sensor_Reflective_Big_C')) {
                    targetType = 'Reflective Sensor';
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
     * Update all visualizations with new data
     */
    updateAll(processor) {
        const metricsInfo = processor.getMetricsInfo();
        
        this.createHexagonChart(metricsInfo);
        this.createTimelineChart(processor.hits);
        this.createScoreChart(processor.events);
        this.createTargetChart(processor.hits);
    }
}

// Export for use in other modules
window.LaserTagVisualizations = LaserTagVisualizations;