class LaserTagTargetDistribution extends LaserTagVisualizations {
	/**
     * Create fullscreen hit matrix
     */
    createFullscreen(hits, container, detailsContainer) {
        if (!hits || hits.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px; font-size: 1.2em;">No hit data available for analysis</p>';
            detailsContainer.innerHTML = '';
            return;
        }

        // Create enhanced hit matrix
        this.createEnhancedHitMatrix(hits, container);
        this.createDetailedHitAnalysis(hits, detailsContainer);
    }

    /**
     * Create enhanced hit matrix showing who hit whom and how many times
     */
    createEnhancedHitMatrix(hits, container) {
        container.innerHTML = '';

        // Process hit data to create matrix
        const matrixData = this.processHitMatrix(hits);
        
        if (!matrixData || matrixData.players.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;">No player hit data available</p>';
            return;
        }

        // Create matrix table
        const tableContainer = document.createElement('div');
        tableContainer.style.cssText = `
            width: 100%;
            background: #f8f9fa;
            border-radius: 12px;
            padding: 20px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            box-sizing: border-box;
        `;

        // Add title
        const title = document.createElement('h3');
        title.textContent = 'Hit Matrix - Who Shot Whom';
        title.style.cssText = `
            text-align: center;
            color: #2c3e50;
            margin: 0 0 25px 0;
            font-size: 1.8em;
            font-weight: bold;
        `;
        tableContainer.appendChild(title);

        // Create table wrapper for overflow handling
        const tableWrapper = document.createElement('div');
        tableWrapper.style.cssText = `
            width: 100%;
            overflow-x: auto;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        `;

        // Create the matrix table
        const table = document.createElement('table');
        table.style.cssText = `
            width: 100%;
            min-width: 400px;
            border-collapse: collapse;
            background: white;
        `;

        // Create header row
        const headerRow = document.createElement('tr');
        headerRow.style.cssText = `
            background: linear-gradient(135deg, #3498db, #2980b9);
            color: white;
        `;

        // Corner cell
        const cornerCell = document.createElement('th');
        cornerCell.textContent = 'Shooter → Target';
        cornerCell.style.cssText = `
            padding: 12px 8px;
            border: 1px solid rgba(255,255,255,0.2);
            font-weight: bold;
            text-align: center;
            font-size: 0.9em;
            min-width: 120px;
        `;
        headerRow.appendChild(cornerCell);

        // Target player columns
        matrixData.players.forEach(player => {
            const th = document.createElement('th');
            th.textContent = player.name;
            th.style.cssText = `
                padding: 12px 8px;
                border: 1px solid rgba(255,255,255,0.2);
                font-weight: bold;
                text-align: center;
                font-size: 0.9em;
                writing-mode: vertical-rl;
                text-orientation: mixed;
                min-width: 60px;
                max-width: 80px;
                background: ${player.color};
                color: white;
            `;
            headerRow.appendChild(th);
        });

        // Total column
        const totalHeader = document.createElement('th');
        totalHeader.textContent = 'Total Hits';
        totalHeader.style.cssText = `
            padding: 12px 8px;
            border: 1px solid rgba(255,255,255,0.2);
            font-weight: bold;
            text-align: center;
            font-size: 0.9em;
            writing-mode: vertical-rl;
            text-orientation: mixed;
            background: #e74c3c;
            color: white;
        `;
        headerRow.appendChild(totalHeader);

        table.appendChild(headerRow);

        // Create data rows
        matrixData.players.forEach((shooter, rowIndex) => {
            const row = document.createElement('tr');
            row.style.backgroundColor = rowIndex % 2 === 0 ? '#ffffff' : '#f8f9fa';

            // Shooter name cell
            const shooterCell = document.createElement('td');
            shooterCell.textContent = shooter.name;
            shooterCell.style.cssText = `
                padding: 10px 12px;
                border: 1px solid #dee2e6;
                font-weight: bold;
                text-align: left;
                background: ${shooter.color};
                color: white;
                position: sticky;
                left: 0;
                z-index: 1;
            `;
            row.appendChild(shooterCell);

            let rowTotal = 0;

            // Hit count cells
            matrixData.players.forEach(target => {
                const hitCount = matrixData.matrix[shooter.id]?.[target.id] || 0;
                rowTotal += hitCount;

                const cell = document.createElement('td');
                cell.textContent = hitCount || '';
                cell.style.cssText = `
                    padding: 10px 8px;
                    border: 1px solid #dee2e6;
                    text-align: center;
                    font-weight: ${hitCount > 0 ? 'bold' : 'normal'};
                    background: ${this.getHeatmapColor(hitCount, matrixData.maxHits)};
                    color: ${hitCount > matrixData.maxHits * 0.7 ? 'white' : '#2c3e50'};
                `;

                // Add click handler for details
                if (hitCount > 0) {
                    cell.style.cursor = 'pointer';
                    cell.title = `${shooter.name} hit ${target.name} ${hitCount} times`;
                    
                    cell.addEventListener('click', () => {
                        this.showHitDetails(shooter, target, hitCount, hits);
                    });

                    cell.addEventListener('mouseenter', () => {
                        cell.style.transform = 'scale(1.1)';
                        cell.style.transition = 'all 0.2s ease';
                        cell.style.zIndex = '10';
                        cell.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                    });

                    cell.addEventListener('mouseleave', () => {
                        cell.style.transform = 'scale(1)';
                        cell.style.zIndex = '1';
                        cell.style.boxShadow = 'none';
                    });
                }

                row.appendChild(cell);
            });

            // Total cell
            const totalCell = document.createElement('td');
            totalCell.textContent = rowTotal;
            totalCell.style.cssText = `
                padding: 10px 8px;
                border: 1px solid #dee2e6;
                text-align: center;
                font-weight: bold;
                background: #e74c3c;
                color: white;
            `;
            row.appendChild(totalCell);

            table.appendChild(row);
        });

        // Create footer row with totals
        const footerRow = document.createElement('tr');
        footerRow.style.cssText = `
            background: linear-gradient(135deg, #27ae60, #229954);
            color: white;
            font-weight: bold;
        `;

        // Footer label
        const footerLabel = document.createElement('td');
        footerLabel.textContent = 'Times Hit';
        footerLabel.style.cssText = `
            padding: 12px;
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            font-weight: bold;
        `;
        footerRow.appendChild(footerLabel);

        let grandTotal = 0;

        // Column totals
        matrixData.players.forEach(target => {
            let columnTotal = 0;
            matrixData.players.forEach(shooter => {
                columnTotal += matrixData.matrix[shooter.id]?.[target.id] || 0;
            });
            grandTotal += columnTotal;

            const cell = document.createElement('td');
            cell.textContent = columnTotal;
            cell.style.cssText = `
                padding: 12px 8px;
                border: 1px solid rgba(255,255,255,0.2);
                text-align: center;
                font-weight: bold;
            `;
            footerRow.appendChild(cell);
        });

        // Grand total
        const grandTotalCell = document.createElement('td');
        grandTotalCell.textContent = grandTotal;
        grandTotalCell.style.cssText = `
            padding: 12px 8px;
            border: 1px solid rgba(255,255,255,0.2);
            text-align: center;
            font-weight: bold;
            background: #c0392b;
        `;
        footerRow.appendChild(grandTotalCell);

        table.appendChild(footerRow);
        tableWrapper.appendChild(table);
        tableContainer.appendChild(tableWrapper);

        // Add legend
        const legend = document.createElement('div');
        legend.style.cssText = `
            margin-top: 20px;
            padding: 15px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
        `;

        legend.innerHTML = `
            <h4 style="margin: 0 0 10px 0; color: #2c3e50;">Legend:</h4>
            <div style="display: flex; flex-wrap: wrap; gap: 15px; font-size: 0.9em;">
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; height: 20px; background: ${this.getHeatmapColor(0, 1)}; border: 1px solid #ccc; margin-right: 5px;"></div>
                    <span>No hits</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; height: 20px; background: ${this.getHeatmapColor(0.3, 1)}; border: 1px solid #ccc; margin-right: 5px;"></div>
                    <span>Few hits</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; height: 20px; background: ${this.getHeatmapColor(0.6, 1)}; border: 1px solid #ccc; margin-right: 5px;"></div>
                    <span>Many hits</span>
                </div>
                <div style="display: flex; align-items: center;">
                    <div style="width: 20px; height: 20px; background: ${this.getHeatmapColor(1, 1)}; border: 1px solid #ccc; margin-right: 5px;"></div>
                    <span>Most hits</span>
                </div>
            </div>
            <p style="margin: 10px 0 0 0; color: #7f8c8d; font-size: 0.85em;">
                💡 Click on any cell with hits to see detailed information about those shots.
            </p>
        `;

        tableContainer.appendChild(legend);
        container.appendChild(tableContainer);
    }

    /**
     * Create detailed hit analysis
     */
    createDetailedHitAnalysis(hits, detailsContainer) {
        const matrixData = this.processHitMatrix(hits);
        
        if (!matrixData) {
            detailsContainer.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No detailed hit data available</p>';
            return;
        }

        const analysisContainer = document.createElement('div');
        analysisContainer.style.cssText = `
            height: 100%;
            max-height: 70vh;
            overflow-y: auto;
            padding: 20px;
            background: #f8f9fa;
            border-radius: 12px;
        `;

        // Overall statistics
        const overallStats = document.createElement('div');
        overallStats.innerHTML = '<h3 style="color: #2c3e50; margin: 0 0 20px 0; border-bottom: 2px solid #e74c3c; padding-bottom: 8px;">Hit Statistics Overview</h3>';

        const statsGrid = document.createElement('div');
        statsGrid.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        `;

        const stats = [
            { label: 'Total Players', value: matrixData.players.length, color: '#3498db' },
            { label: 'Total Hits', value: matrixData.totalHits, color: '#e74c3c' },
            { label: 'Most Active Shooter', value: matrixData.topShooter.name, color: '#27ae60' },
            { label: 'Most Hit Player', value: matrixData.topTarget.name, color: '#f39c12' },
            { label: 'Max Hits on Single Player', value: matrixData.maxHits, color: '#9b59b6' },
            { label: 'Average Hits per Player', value: (matrixData.totalHits / matrixData.players.length).toFixed(1), color: '#34495e' }
        ];

        stats.forEach(stat => {
            const statCard = document.createElement('div');
            statCard.style.cssText = `
                background: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border-left: 4px solid ${stat.color};
                text-align: center;
            `;
            
            statCard.innerHTML = `
                <div style="font-size: 2em; font-weight: bold; color: ${stat.color}; margin-bottom: 5px;">${stat.value}</div>
                <div style="color: #7f8c8d; font-size: 0.9em;">${stat.label}</div>
            `;
            
            statsGrid.appendChild(statCard);
        });

        overallStats.appendChild(statsGrid);

        // Player performance breakdown
        const playerBreakdown = document.createElement('div');
        playerBreakdown.innerHTML = '<h3 style="color: #2c3e50; margin: 30px 0 20px 0; border-bottom: 2px solid #27ae60; padding-bottom: 8px;">Player Performance Analysis</h3>';

        // Sort players by total hits given
        const playerStats = matrixData.players.map(player => {
            let hitsGiven = 0;
            let hitsReceived = 0;
            
            matrixData.players.forEach(target => {
                hitsGiven += matrixData.matrix[player.id]?.[target.id] || 0;
                hitsReceived += matrixData.matrix[target.id]?.[player.id] || 0;
            });
            
            return {
                ...player,
                hitsGiven,
                hitsReceived,
                ratio: hitsReceived > 0 ? (hitsGiven / hitsReceived).toFixed(2) : hitsGiven > 0 ? '∞' : '0'
            };
        }).sort((a, b) => b.hitsGiven - a.hitsGiven);

        playerStats.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.style.cssText = `
                background: white;
                margin: 15px 0;
                padding: 20px;
                border-radius: 12px;
                box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                border-left: 5px solid ${player.color};
            `;

            const performance = player.hitsGiven > player.hitsReceived ? 'Aggressive' : 
                              player.hitsGiven < player.hitsReceived ? 'Defensive' : 'Balanced';
            const performanceColor = performance === 'Aggressive' ? '#e74c3c' : 
                                   performance === 'Defensive' ? '#3498db' : '#27ae60';

            playerCard.innerHTML = `
                <h4 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 1.3em; display: flex; justify-content: space-between; align-items: center;">
                    ${player.name}
                    <span style="font-size: 0.7em; background: ${performanceColor}; color: white; padding: 4px 12px; border-radius: 20px;">
                        ${performance} Player
                    </span>
                </h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px;">
                    <div>
                        <div style="font-size: 1.4em; font-weight: bold; color: #e74c3c;">${player.hitsGiven}</div>
                        <div style="color: #7f8c8d; font-size: 0.9em;">Hits Given</div>
                    </div>
                    <div>
                        <div style="font-size: 1.4em; font-weight: bold; color: #3498db;">${player.hitsReceived}</div>
                        <div style="color: #7f8c8d; font-size: 0.9em;">Hits Taken</div>
                    </div>
                    <div>
                        <div style="font-size: 1.4em; font-weight: bold; color: #27ae60;">${player.ratio}</div>
                        <div style="color: #7f8c8d; font-size: 0.9em;">Hit Ratio</div>
                    </div>
                    <div>
                        <div style="font-size: 1.4em; font-weight: bold; color: #f39c12;">#${index + 1}</div>
                        <div style="color: #7f8c8d; font-size: 0.9em;">Shooter Rank</div>
                    </div>
                </div>
            `;

            playerBreakdown.appendChild(playerCard);
        });

        analysisContainer.appendChild(overallStats);
        analysisContainer.appendChild(playerBreakdown);
        detailsContainer.appendChild(analysisContainer);
    }
    /**
     * Create hit matrix data processor
     */
    processHitMatrix(hits) {
        // Get player data from the global data processor
        const playerData = window.globalDataProcessor?.data?.PlayerData || {};
        
        if (!playerData || Object.keys(playerData).length === 0) {
            console.warn('No player data available for hit matrix');
            return null;
        }

        // Create player list with colors
        const players = Object.entries(playerData).map(([id, data]) => ({
            id: id,
            name: data.playerName || `Player ${id}`,
            color: this.getPlayerColor(data, id)
        }));

        // Initialize matrix
        const matrix = {};
        players.forEach(shooter => {
            matrix[shooter.id] = {};
            players.forEach(target => {
                matrix[shooter.id][target.id] = 0;
            });
        });

        // Process hits
        let maxHits = 0;
        let totalHits = 0;
        
        hits.forEach(hit => {
            const shooterId = hit.instigatorStateId?.index?.toString();
            const targetId = hit.hitStateId?.index?.toString();
            
            if (shooterId && targetId && shooterId !== targetId && matrix[shooterId] && matrix[shooterId][targetId] !== undefined) {
                matrix[shooterId][targetId]++;
                maxHits = Math.max(maxHits, matrix[shooterId][targetId]);
                totalHits++;
            }
        });

        // Find top shooter and target
        let topShooter = players[0];
        let topTarget = players[0];
        let maxShotsGiven = 0;
        let maxShotsReceived = 0;

        players.forEach(player => {
            let shotsGiven = 0;
            let shotsReceived = 0;
            
            players.forEach(other => {
                shotsGiven += matrix[player.id][other.id];
                shotsReceived += matrix[other.id][player.id];
            });
            
            if (shotsGiven > maxShotsGiven) {
                maxShotsGiven = shotsGiven;
                topShooter = player;
            }
            
            if (shotsReceived > maxShotsReceived) {
                maxShotsReceived = shotsReceived;
                topTarget = player;
            }
        });

        return {
            players,
            matrix,
            maxHits,
            totalHits,
            topShooter,
            topTarget
        };
    }

    /**
     * Get player color from their data
     */
    getPlayerColor(playerData, playerId) {
        if (playerData.preferredPrimaryColor) {
            const color = playerData.preferredPrimaryColor;
            return `rgb(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)})`;
        }
        
        // Default colors if no preference set
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        return colors[parseInt(playerId) % colors.length];
    }

    /**
     * Get heatmap color based on hit count
     */
    getHeatmapColor(hitCount, maxHits) {
        if (hitCount === 0) {
            return '#f8f9fa';
        }
        
        const intensity = hitCount / maxHits;
        const red = Math.floor(231 + (255 - 231) * intensity);   // 231-255 (light to bright red)
        const green = Math.floor(76 - 76 * intensity);           // 76-0 (some green to no green)
        const blue = Math.floor(60 - 60 * intensity);            // 60-0 (some blue to no blue)
        
        return `rgb(${red}, ${green}, ${blue})`;
    }

    /**
     * Show detailed hit information
     */
    showHitDetails(shooter, target, hitCount, allHits) {
        // Filter hits between these two players
        const relevantHits = allHits.filter(hit => 
            hit.instigatorStateId?.index?.toString() === shooter.id &&
            hit.hitStateId?.index?.toString() === target.id
        );

        // Create modal content
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: white;
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            max-height: 70vh;
            overflow-y: auto;
            position: relative;
        `;

        content.innerHTML = `
            <button style="position: absolute; top: 10px; right: 10px; background: none; border: none; font-size: 24px; cursor: pointer; color: #7f8c8d;" onclick="this.closest('div[style*=\"position: fixed\"]').remove()">×</button>
            <h3 style="color: #2c3e50; margin: 0 0 20px 0;">Hit Details</h3>
            <div style="background: linear-gradient(135deg, ${shooter.color}, ${target.color}); color: white; padding: 15px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
                <strong>${shooter.name}</strong> → <strong>${target.name}</strong><br>
                <span style="font-size: 1.5em; margin-top: 10px; display: block;">${hitCount} hits</span>
            </div>
            <div style="max-height: 300px; overflow-y: auto;">
                ${relevantHits.slice(0, 10).map((hit, i) => `
                    <div style="background: #f8f9fa; margin: 10px 0; padding: 15px; border-radius: 8px; border-left: 4px solid ${shooter.color};">
                        <div style="font-weight: bold; color: #2c3e50;">Hit ${i + 1}</div>
                        <div style="color: #7f8c8d; font-size: 0.9em; margin-top: 5px;">
                            Target: ${hit.hitFriendlyName || 'Unknown'}<br>
                            Distance: ${hit.distance ? Math.round(hit.distance) + 'm' : 'Unknown'}<br>
                            Points: ${hit.basePointValue || 0} × ${hit.pointMultiplier || 1} = ${(hit.basePointValue || 0) * (hit.pointMultiplier || 1)}
                        </div>
                    </div>
                `).join('')}
                ${relevantHits.length > 10 ? `<div style="text-align: center; color: #7f8c8d; margin-top: 15px;">...and ${relevantHits.length - 10} more hits</div>` : ''}
            </div>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Close on background click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    /**
     * Create target distribution pie chart for preview
     */
    loadData(processor) {
        // Store reference to the processor for access to player data
        window.globalDataProcessor = processor;
        
        const hits = processor.hits;
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

        // Add click handler for fullscreen - this will show the hit matrix
        container.style.cursor = 'pointer';
        container.addEventListener('click', () => {
            this.openFullscreen('hitMatrix', hits, 'Player Hit Matrix - Detailed Analysis');
        });

        // Add fullscreen indicator
        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.innerHTML = '🔍 View Hit Matrix';
        fullscreenBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            
            padding: 5px 10px;
            cursor: pointer;
        `;
        container.style.position = 'relative';
        container.appendChild(fullscreenBtn);
    }

    /**
     * Abbreviate player name for compact display
     */
    abbreviateName(name) {
        if (name.length <= 4) return name;
        
        // Try to get initials from words
        const words = name.split(/[\s_-]+/);
        if (words.length > 1) {
            return words.map(w => w.charAt(0)).join('').substring(0, 3);
        }
        
        // Just take first 3 characters
        return name.substring(0, 3);
    }
}