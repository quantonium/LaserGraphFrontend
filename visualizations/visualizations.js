/**
 * Visualization Module for Laser Tag Analytics
 * Creates and manages various data visualizations
 */

class LaserTagVisualizations {
	static visualizations = new Set()

	targetElementId = ""

	constructor(target) {
		LaserTagVisualizations.visualizations.add(this)
		this.targetElementId = target
	}

	/**
	 * gets the document element specified by the targetElement
	 */
	getContainer() {
		return document.getElementById(this.targetElementId)
	}

	getContainerD3() {
		return d3.select(this.getContainer())
	}

	/**
	 * Loads data onto the main visualization
	 * @param {*} processor the dataProcessor containing data to load
	 */
	loadData(processor) {}

	/**
	 * Creates a fullscreen modal with more info
	 * @param {*} data the data which to visualize
	 * @param {*} container
	 * @param {*} detailsContainer 
	 */
	createFullscreen(data, container, detailsContainer) {}

	/**
	 * Create the modal structure for fullscreen chart viewing
	 */
	static createModalStructure() {
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

		this.createFullscreen(data, modalChart, modalDetails);

		// Create fullscreen version based on chart type
		/*switch (chartType) {
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
		}*/
	}

	/**
	 * Process target data for analysis
	 */
	processTargetData(hits) {
		const targetData = {};
		const playerTargets = {};

		hits.forEach(hit => {
			if (hit.hitComponent) {
				const component = hit.hitComponent;
				let targetType = 'Unknown';
				
				// Extract the full sensor name as the target type
				if (component.includes('Sensor_')) {
					// Keep the full sensor component name as the target type
					targetType = component;
				} else {
					// For non-sensor components, use the component name directly
					targetType = component;
				}

				if (!targetData[targetType]) {
					targetData[targetType] = {
						count: 0,
						multipliers: [],
						players: new Set()
					};
				}

				targetData[targetType].count++;
				if (hit.multiplierValue !== undefined) {
					targetData[targetType].multipliers.push(hit.multiplierValue);
				}
				if (hit.shooterPlayerID !== undefined) {
					targetData[targetType].players.add(hit.shooterPlayerID);
					
					if (!playerTargets[hit.shooterPlayerID]) {
						playerTargets[hit.shooterPlayerID] = {};
					}
					playerTargets[hit.shooterPlayerID][targetType] = (playerTargets[hit.shooterPlayerID][targetType] || 0) + 1;
				}
			}
		});

		const totalHits = hits.length;
		const targetTypes = Object.keys(targetData).sort((a, b) => targetData[b].count - targetData[a].count);

		// Calculate derived statistics
		targetTypes.forEach((targetType, index) => {
			const data = targetData[targetType];
			data.percentage = (data.count / totalHits) * 100;
			data.avgMultiplier = data.multipliers.length > 0 ? 
				data.multipliers.reduce((sum, mult) => sum + mult, 0) / data.multipliers.length : null;
			data.maxMultiplier = data.multipliers.length > 0 ? Math.max(...data.multipliers) : null;
			data.players = Array.from(data.players);
			data.rank = index + 1;
			
			// Determine player distribution pattern
			if (data.players.length === 1) {
				data.playerDistribution = 'Single player focus';
			} else if (data.players.length <= 3) {
				data.playerDistribution = 'Few players targeting';
			} else {
				data.playerDistribution = 'Multiple players targeting';
			}
		});

		return targetData;
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
	 * Update all visualizations with new data
	 */
	static updateAll(processor) {
		LaserTagVisualizations.visualizations.forEach((v) => {
			v.loadData(processor)
		})
	}
}

LaserTagVisualizations.createModalStructure();