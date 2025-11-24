/**
 * Visualization Module for Laser Tag Analytics
 * Creates and manages various data visualizations
 */

class LaserTagVisualizations {
    constructor() {
        this.charts = {};
        this.createModalStructure();
    }

    /**
     * Create the modal structure for fullscreen chart viewing
     */
    createModalStructure() {
        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'chartModal';
        modalOverlay.className = 'chart-modal';
        modalOverlay.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2 id="modalTitle">Chart Details</h2>
                    <button class="modal-close" onclick="this.closest('.chart-modal').style.display='none'">&times;</button>
                </div>
                <div class="modal-body">
                    <div id="modalChart"></div>
                    <div id="modalDetails"></div>
                </div>
            </div>
        `;
        document.body.appendChild(modalOverlay);

        // Close modal when clicking outside
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
            }
        });

        // Close modal with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display === 'block') {
                modalOverlay.style.display = 'none';
            }
        });
    }

    /**
     * Open a chart in fullscreen modal
     */
    openFullscreen(chartType, data, title) {
        const modal = document.getElementById('chartModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalChart = document.getElementById('modalChart');
        const modalDetails = document.getElementById('modalDetails');

        modalTitle.textContent = title;
        modalChart.innerHTML = '';
        modalDetails.innerHTML = '';

        // Show modal
        modal.style.display = 'block';

        // Create fullscreen version based on chart type
        switch (chartType) {
            case 'hexagon':
                this.createFullscreenHexagon(data, modalChart, modalDetails);
                break;
            case 'timeline':
                this.createFullscreenTimeline(data, modalChart, modalDetails);
                break;
            case 'score':
                this.createFullscreenScore(data, modalChart, modalDetails);
                break;
            case 'target':
                this.createFullscreenTarget(data, modalChart, modalDetails);
                break;
        }
    }

    /**
     * Create fullscreen hexagon chart with detailed metrics
     */
    createFullscreenHexagon(metricsInfo, container, detailsContainer) {
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
     * Create fullscreen timeline chart with enhanced details
     */
    createFullscreenTimeline(hits, container, detailsContainer) {
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
     * Create fullscreen score progression
     */
    createFullscreenScore(events, container, detailsContainer) {
        // Enhanced score chart implementation
        container.innerHTML = '<div class="enhanced-score-chart">Enhanced score progression will be displayed here</div>';
        detailsContainer.innerHTML = '<div class="score-analysis">Detailed score analysis will be shown here</div>';
    }

    /**
     * Create fullscreen target distribution
     */
    createFullscreenTarget(hits, container, detailsContainer) {
        // Enhanced target chart implementation
        container.innerHTML = '<div class="enhanced-target-chart">Enhanced target distribution will be displayed here</div>';
        detailsContainer.innerHTML = '<div class="target-analysis">Detailed target analysis will be shown here</div>';
    }

    /**
     * Helper methods for performance evaluation
     */
    getPerformanceLevel(value) {
        if (value >= 80) return 'excellent';
        if (value >= 60) return 'good';
        if (value >= 40) return 'average';
        if (value >= 20) return 'poor';
        return 'very-poor';
    }

    getPerformanceText(value) {
        if (value >= 80) return 'Excellent';
        if (value >= 60) return 'Good';
        if (value >= 40) return 'Average';
        if (value >= 20) return 'Needs Improvement';
        return 'Poor';
    }

    /**
     * Create hexagon radar chart using D3.js
     */
    createHexagonChart(metricsInfo) {
        const container = document.getElementById('hexChart');
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

    /**
     * Create timeline chart showing hits over time
     */
    createTimelineChart(hits) {
        const container = document.getElementById('timelineChart');
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
     * Create player interaction network graph
     */
    createPlayerNetworkGraph(networkData) {
        const container = document.getElementById('nodeGraph');
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
        this.charts.nodeGraph = { svg, simulation };
    }

    /**
     * Update all visualizations with new data
     */
    updateAll(processor) {
        const metricsInfo = processor.getMetricsInfo();
        const networkData = processor.calculatePlayerNetwork();
        
        this.createHexagonChart(metricsInfo);
        this.createTimelineChart(processor.hits);
        this.createScoreChart(processor.events); // Use score progression chart
        this.createTargetChart(processor.hits);
        this.createPlayerNetworkGraph(networkData);
    }
}

// Export for use in other modules
window.LaserTagVisualizations = LaserTagVisualizations;
