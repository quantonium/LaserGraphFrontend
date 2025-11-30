class LaserTagTargetDistribution extends LaserTagVisualizations {
	/**
     * Create fullscreen target distribution
     */
    createFullscreen(hits, container, detailsContainer) {
        if (!hits || hits.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px; font-size: 1.2em;">No hit data available for analysis</p>';
            detailsContainer.innerHTML = '';
            return;
        }

        // Create enhanced visualization
        this.createEnhancedTargetChart(hits, container);
        this.createDetailedTargetAnalysis(hits, detailsContainer);
    }

    /**
     * Create enhanced target chart with detailed breakdown
     */
    createEnhancedTargetChart(hits, container) {
        const containerWidth = container.clientWidth || 400;
        const width = Math.max(300, containerWidth - 40);
        const height = 400;
        const margin = { top: 40, right: 80, bottom: 80, left: 120 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        container.innerHTML = '';

        // Process target data
        const targetData = this.processTargetData(hits);
        const targetTypes = Object.keys(targetData).sort((a, b) => targetData[b].count - targetData[a].count);

        // Create SVG
        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', '#f8f9fa')
            .style('border-radius', '8px');

        const g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Create scales
        const xScale = d3.scaleBand()
            .domain(targetTypes)
            .range([0, chartWidth])
            .padding(0.2);

        const yScale = d3.scaleLinear()
            .domain([0, Math.max(...targetTypes.map(type => targetData[type].count))])
            .range([chartHeight, 0]);

        // Color scale based on target effectiveness
        const colorScale = d3.scaleSequential(d3.interpolateViridis)
            .domain([0, Math.max(...targetTypes.map(type => targetData[type].avgMultiplier || 1))]);

        // Add axes
        g.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale))
            .selectAll('text')
            .attr('transform', 'rotate(-45)')
            .style('text-anchor', 'end')
            .style('font-size', '12px')
            .style('fill', '#2c3e50');

        g.append('g')
            .call(d3.axisLeft(yScale))
            .append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', -60)
            .attr('x', -chartHeight / 2)
            .attr('fill', '#2c3e50')
            .style('text-anchor', 'middle')
            .style('font-weight', 'bold')
            .text('Number of Hits');

        // Create bars
        g.selectAll('.target-bar')
            .data(targetTypes)
            .enter()
            .append('rect')
            .attr('class', 'target-bar')
            .attr('x', d => xScale(d))
            .attr('y', chartHeight)
            .attr('width', xScale.bandwidth())
            .attr('height', 0)
            .attr('fill', d => colorScale(targetData[d].avgMultiplier || 1))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1)
            .style('cursor', 'pointer')
            .transition()
            .duration(1000)
            .delay((d, i) => i * 100)
            .attr('y', d => yScale(targetData[d].count))
            .attr('height', d => chartHeight - yScale(targetData[d].count));

        // Add value labels on bars
        g.selectAll('.bar-label')
            .data(targetTypes)
            .enter()
            .append('text')
            .attr('class', 'bar-label')
            .attr('x', d => xScale(d) + xScale.bandwidth() / 2)
            .attr('y', d => yScale(targetData[d].count) - 5)
            .attr('text-anchor', 'middle')
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(d => targetData[d].count)
            .style('opacity', 0)
            .transition()
            .duration(1000)
            .delay((d, i) => i * 100 + 500)
            .style('opacity', 1);

        // Add hover interactions
        g.selectAll('.target-bar')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .attr('stroke-width', 3)
                    .attr('stroke', '#e74c3c');

                // Create tooltip
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'target-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '12px')
                    .style('border-radius', '6px')
                    .style('font-size', '13px')
                    .style('pointer-events', 'none')
                    .style('z-index', '1000')
                    .style('opacity', 0);

                tooltip.transition().duration(200).style('opacity', 1);

                const data = targetData[d];
                tooltip.html(`
                    <strong>${d}</strong><br>
                    Hits: ${data.count}<br>
                    Avg Multiplier: ${data.avgMultiplier?.toFixed(2) || 'N/A'}<br>
                    Percentage: ${data.percentage.toFixed(1)}%<br>
                    ${data.players?.length || 0} different players
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .attr('stroke-width', 1)
                    .attr('stroke', '#fff');
                
                d3.selectAll('.target-tooltip').remove();
            });

        // Add title
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('fill', '#2c3e50')
            .style('text-anchor', 'middle')
            .style('font-size', '18px')
            .style('font-weight', 'bold')
            .text('Target Hit Distribution Analysis');

        // Add legend for color coding
        const legend = svg.append('g')
            .attr('transform', `translate(${width - 70}, 60)`);

        legend.append('text')
            .attr('x', 0)
            .attr('y', 0)
            .style('font-size', '12px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text('Avg Multiplier');

        const legendScale = d3.scaleLinear()
            .domain(d3.extent(targetTypes, d => targetData[d].avgMultiplier || 1))
            .range([10, 80]);

        const legendAxis = d3.axisRight(legendScale)
            .tickSize(6)
            .ticks(4);

        legend.append('g')
            .attr('transform', 'translate(20, 10)')
            .call(legendAxis)
            .selectAll('text')
            .style('font-size', '10px');
    }

    /**
     * Create detailed target analysis
     */
    createDetailedTargetAnalysis(hits, container) {
        container.innerHTML = '';

        const targetData = this.processTargetData(hits);
        const targetTypes = Object.keys(targetData).sort((a, b) => targetData[b].count - targetData[a].count);

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
        
        const totalHits = hits.length;
        const uniqueTargets = targetTypes.length;
        const avgHitsPerTarget = totalHits / uniqueTargets;
        const mostHitTarget = targetTypes[0];

        overallStats.innerHTML = `
            <h3 style="color: #2c3e50; margin-bottom: 15px; border-bottom: 2px solid #27ae60; padding-bottom: 8px;">Target Analysis Overview</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 15px;">
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #27ae60;">${totalHits}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Total Hits</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #3498db;">${uniqueTargets}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Unique Targets</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.5em; font-weight: bold; color: #f39c12;">${avgHitsPerTarget.toFixed(1)}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Avg Hits/Target</div>
                </div>
                <div style="background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <div style="font-size: 1.2em; font-weight: bold; color: #e74c3c;">${mostHitTarget}</div>
                    <div style="color: #7f8c8d; font-size: 0.9em;">Most Hit Target</div>
                </div>
            </div>
        `;

        // Target breakdown
        const targetBreakdown = document.createElement('div');
        targetBreakdown.innerHTML = '<h3 style="color: #2c3e50; margin: 30px 0 15px 0; border-bottom: 2px solid #27ae60; padding-bottom: 8px;">Target Breakdown</h3>';

        targetTypes.forEach((targetType, index) => {
            const data = targetData[targetType];
            const targetCard = document.createElement('div');
            targetCard.style.cssText = `
                background: white;
                margin: 15px 0;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border-left: 5px solid ${index === 0 ? '#e74c3c' : index === 1 ? '#f39c12' : '#27ae60'};
            `;

            const effectiveness = data.avgMultiplier > 1.5 ? 'High' : data.avgMultiplier > 1 ? 'Medium' : 'Low';
            const effectivenessColor = effectiveness === 'High' ? '#27ae60' : effectiveness === 'Medium' ? '#f39c12' : '#e74c3c';

            targetCard.innerHTML = `
                <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 1.3em; display: flex; justify-content: space-between; align-items: center;">
                    ${targetType}
                    <span style="font-size: 0.7em; background: ${effectivenessColor}; color: white; padding: 4px 8px; border-radius: 12px;">
                        ${effectiveness} Value
                    </span>
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #3498db;">${data.count}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Hits</div>
                    </div>
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #27ae60;">${data.percentage.toFixed(1)}%</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Share</div>
                    </div>
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #e74c3c;">${data.avgMultiplier?.toFixed(2) || 'N/A'}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Avg Multiplier</div>
                    </div>
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #9b59b6;">${data.players?.length || 0}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Players</div>
                    </div>
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #f39c12;">${data.maxMultiplier?.toFixed(1) || 'N/A'}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Max Multiplier</div>
                    </div>
                    <div>
                        <div style="font-size: 1.3em; font-weight: bold; color: #34495e;">${data.rank}</div>
                        <div style="color: #7f8c8d; font-size: 0.8em;">Popularity Rank</div>
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <div style="font-size: 0.9em; color: #34495e;">
                        <strong>Player Distribution:</strong> ${data.playerDistribution || 'Even spread across players'}
                    </div>
                </div>
            `;

            targetBreakdown.appendChild(targetCard);
        });

        analysisContainer.appendChild(overallStats);
        analysisContainer.appendChild(targetBreakdown);
        container.appendChild(analysisContainer);
    }

	/**
     * Create target distribution chart
     */
    loadData(processor) {
		const hits = processor.hits
        const container = this.getContainer();
        container.innerHTML = '';
        
        if (!hits || hits.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No target data available</p>';
            return;
        }

        // Process target data
        const targetData = this.processTargetData(hits);
        const targetTypes = Object.keys(targetData).sort((a, b) => targetData[b].count - targetData[a].count);
        
        if (targetTypes.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 20px;">No target data available</p>';
            return;
        }

        // Create compact donut chart with D3
        const width = 300;
        const height = 300;
        const radius = Math.min(width, height) / 2 - 20;
        const innerRadius = radius * 0.6;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('display', 'block')
            .style('margin', '0 auto');

        const g = svg.append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // Color scale
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(targetTypes);

        // Pie generator
        const pie = d3.pie()
            .value(d => targetData[d].count)
            .sort(null);

        // Arc generator
        const arc = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(radius);

        // Create pie slices
        const slices = g.selectAll('.slice')
            .data(pie(targetTypes))
            .enter()
            .append('g')
            .attr('class', 'slice')
            .style('cursor', 'pointer');

        slices.append('path')
            .attr('d', arc)
            .attr('fill', d => colorScale(d.data))
            .attr('stroke', '#fff')
            .attr('stroke-width', 2)
            .style('opacity', 0.8)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('opacity', 1)
                    .attr('transform', 'scale(1.05)');
                
                // Show tooltip
                const data = targetData[d.data];
                const tooltip = d3.select('body')
                    .append('div')
                    .attr('class', 'target-tooltip')
                    .style('position', 'absolute')
                    .style('background', 'rgba(0,0,0,0.8)')
                    .style('color', 'white')
                    .style('padding', '10px')
                    .style('border-radius', '6px')
                    .style('font-size', '12px')
                    .style('pointer-events', 'none')
                    .style('opacity', 0);

                tooltip.transition().duration(200).style('opacity', 1);
                tooltip.html(`
                    <strong>${d.data}</strong><br>
                    Hits: ${data.count} (${data.percentage.toFixed(1)}%)<br>
                    Avg Multiplier: ${data.avgMultiplier?.toFixed(2) || 'N/A'}<br>
                    Players: ${data.players?.length || 0}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 10) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('opacity', 0.8)
                    .attr('transform', 'scale(1)');
                
                d3.selectAll('.target-tooltip').remove();
            });

        // Add labels
        slices.append('text')
            .attr('transform', d => {
                const pos = arc.centroid(d);
                return `translate(${pos[0]}, ${pos[1]})`;
            })
            .attr('text-anchor', 'middle')
            .style('font-size', '11px')
            .style('font-weight', 'bold')
            .style('fill', '#fff')
            .style('text-shadow', '1px 1px 1px rgba(0,0,0,0.5)')
            .text(d => {
                const percentage = targetData[d.data].percentage;
                return percentage > 8 ? `${percentage.toFixed(0)}%` : '';
            });

        // Add center text showing total hits
        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.5em')
            .style('font-size', '24px')
            .style('font-weight', 'bold')
            .style('fill', '#2c3e50')
            .text(hits.length);

        g.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1em')
            .style('font-size', '12px')
            .style('fill', '#7f8c8d')
            .text('Total Hits');

        // Create compact legend below the chart
        const legend = d3.select(container)
            .append('div')
            .style('display', 'flex')
            .style('flex-wrap', 'wrap')
            .style('justify-content', 'center')
            .style('margin-top', '15px')
            .style('gap', '10px');

        targetTypes.slice(0, 5).forEach(targetType => { // Show only top 5
            const data = targetData[targetType];
            const legendItem = legend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('font-size', '11px')
                .style('color', '#2c3e50');

            legendItem.append('div')
                .style('width', '12px')
                .style('height', '12px')
                .style('background', colorScale(targetType))
                .style('border-radius', '2px')
                .style('margin-right', '5px');

            legendItem.append('span')
                .text(`${targetType}: ${data.count}`);
        });

        if (targetTypes.length > 5) {
            legend.append('div')
                .style('font-size', '11px')
                .style('color', '#7f8c8d')
                .style('font-style', 'italic')
                .text(`+${targetTypes.length - 5} more...`);
        }

        // Add click handler for fullscreen
        container.style.cursor = 'pointer';
        container.addEventListener('click', () => {
            this.openFullscreen('target', hits, 'Target Distribution - Detailed Analysis');
        });

        // Add fullscreen indicator
        const fullscreenBtn = document.createElement('div');
        fullscreenBtn.innerHTML = '🔍 View Details';
        fullscreenBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            background: rgba(46, 204, 113, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 15px;
            cursor: pointer;
            font-size: 12px;
        `;
        container.style.position = 'relative';
        container.appendChild(fullscreenBtn);
    }
}