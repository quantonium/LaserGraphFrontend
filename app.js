/**
 * Main Application Module
 * Coordinates data loading, processing, and visualization
 */

class LaserTagApp {
	constructor() {
		this.processor = null;
		//this.visualizations = new LaserTagVisualizations();
		this.data = null;
		this.currentFile = null;

		//visualizations
		this.hitTimeline = new LaserTagHitTimeline("timelineChart");
		this.hexChart = new LaserTagHexagon("hexChart");
		this.networkGraph = new LaserTagNetworkGraph("nodeGraph");
		this.scoreProgression = new LaserTagScoreProgression("scoreChart")
		this.targetDist = new LaserTagTargetDistribution("targetChart")
		this.playerScores = new LaserTagLeaderboard("playerScores")
		
		// Initialize file upload handlers
		this.initFileUpload();
	}

	/**
	 * Initialize the application UI (no automatic data loading)
	 */
	async init() {
		console.log('Laser Tag Analytics App ready for data upload...');

		document.getElementById("fileUpload").style.display = "block"
		document.getElementById("statsView").style.display = "none"

		let playerElement = document.getElementById("playerSelect")
		let teamElement = document.getElementById("teamSelect")

		teamElement.addEventListener("onchange", (e) => {this.onTeamSelect(e)})
		playerElement.addEventListener("onchange", (e) => {this.onTeamSelect(e)})

		const applyButton = document.getElementById('applyTimeRange');
		const resetButton = document.getElementById('resetTimeRange');
		const startTimeInput = document.getElementById('startTime');
		const endTimeInput = document.getElementById('endTime');

		applyButton.addEventListener("click", (e) => {
			const startTime = parseFloat(startTimeInput.value) || 0;
			const endTime = parseFloat(endTimeInput.value) || this.data.SessionInfo.serverTime;
			if (startTime >= endTime) {
				alert('Start time must be less than end time');
				return;
			}

			this.updateTimeRange(startTime, endTime)
		})

		resetButton.addEventListener("click", (e) => {
			this.updateTimeRange(0, -1);
			startTimeInput.value = 0;
			endTimeInput.value = this.data.SessionInfo.serverTime
		})
	}

	/**
	 * Initialize file upload functionality
	 */
	initFileUpload() {
		const uploadArea = document.getElementById('uploadArea');
		const fileInput = document.getElementById('fileInput');
		const browseBtn = document.getElementById('browseBtn');
		const processBtn = document.getElementById('processBtn');
		const loadSampleBtn = document.getElementById('loadSampleBtn');
		const removeFileBtn = document.getElementById('removeFileBtn');
		const fileInfo = document.getElementById('fileInfo');

		// Drag and drop handlers
		uploadArea.addEventListener('dragover', (e) => {
			e.preventDefault();
			uploadArea.classList.add('drag-over');
		});

		uploadArea.addEventListener('dragleave', (e) => {
			e.preventDefault();
			uploadArea.classList.remove('drag-over');
		});

		uploadArea.addEventListener('drop', (e) => {
			e.preventDefault();
			uploadArea.classList.remove('drag-over');
			const files = e.dataTransfer.files;
			if (files.length > 0) {
				this.handleFile(files[0]);
			}
		});

		// Click to browse
		browseBtn.addEventListener('click', () => {
			fileInput.click();
		});

		uploadArea.addEventListener('click', () => {
			fileInput.click();
		});

		// File input change
		fileInput.addEventListener('change', (e) => {
			if (e.target.files.length > 0) {
				this.handleFile(e.target.files[0]);
			}
		});

		// Process button
		processBtn.addEventListener('click', () => {
			if (this.currentFile) {
				this.processUploadedFile();
			}
		});

		// Load sample data button
		loadSampleBtn.addEventListener('click', () => {
			this.loadSampleData();
		});

		// Remove file button
		removeFileBtn.addEventListener('click', () => {
			this.clearFile();
		});


	}

	/**
	 * Handle uploaded file
	 */
	handleFile(file) {
		if (file.type !== 'application/json' && !(file.name.endsWith('.json') || file.name.endsWith('.ljson'))) {
			this.showError('Please upload a JSON file.');
			return;
		}

		this.currentFile = file;
		this.displayFileInfo(file);
		document.getElementById('processBtn').disabled = false;
	}

	/**
	 * Display file information
	 */
	displayFileInfo(file) {
		const fileName = document.getElementById('fileName');
		const fileSize = document.getElementById('fileSize');
		const fileInfo = document.getElementById('fileInfo');
		const uploadArea = document.getElementById('uploadArea');

		fileName.textContent = file.name;
		fileSize.textContent = this.formatFileSize(file.size);
		fileInfo.style.display = 'flex';
		uploadArea.style.display = 'none';
	}

	/**
	 * Clear selected file
	 */
	clearFile() {
		this.currentFile = null;
		document.getElementById('fileInfo').style.display = 'none';
		document.getElementById('uploadArea').style.display = 'flex';
		document.getElementById('processBtn').disabled = true;
		document.getElementById('fileInput').value = '';
	}

	/**
	 * Format file size for display
	 */
	formatFileSize(bytes) {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	/**
	 * Process uploaded file
	 */
	async processUploadedFile() {
		if (!this.currentFile) return;

		try {
			const text = await this.currentFile.text();
			this.data = JSON.parse(text);
			
			await this.processAndVisualize();
			
		} catch (error) {
			console.error('Error processing uploaded file:', error);
			this.showError('Error processing file. Please ensure it is a valid JSON file.');
		}
	}

	/**
	 * Load sample data
	 */
	async loadSampleData() {
		try {
			const response = await fetch('./sample-match-data.json');
			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`);
			}
			this.data = await response.json();
			
			await this.processAndVisualize();
			
		} catch (error) {
			console.error('Error loading sample data:', error);
			this.showError('Failed to load sample data. Please check if the file exists.');
		}
	}

	/**
	 * Process data and create visualizations
	 */
	async processAndVisualize() {
		try {
			// Process the data
			this.processData();
			
			this.updateText();

			this.updateFilterElements();

			// Create visualizations
			this.createVisualizations();
			
			// Update metrics display
			this.updateMetricsDisplay();

			let time = this.data.SessionInfo.serverTime

			this.updateTimeRange(0, time);
			
			console.log('Data processed and visualizations created successfully!');

			document.getElementById("statsView").style.display = "block"

			toggleUpload()
			
		} catch (error) {
			console.error('Error processing data:', error);
			this.showError('Failed to process data. Please check the console for details.');
		}
	}

	/**
	 * Process the loaded data
	 */
	processData() {
		if (!this.data) {
			throw new Error('No data to process');
		}
		
		this.processor = new LaserTagDataProcessor(this.data);
		const metrics = this.processor.calculateMetrics();
		console.log('Calculated metrics:', metrics);
	}

	/**
	 * Create all visualizations
	 */
	createVisualizations() {
		if (!this.processor) {
			throw new Error('No processor available');
		}
		
		console.log('Creating visualizations...');
		LaserTagVisualizations.updateAll(this.processor);
	}

	/**
	 * Updates text elements within the visualization, like game name
	 */
	updateText() {
		document.getElementById("gametype").innerText = this.data.MatchData.gameTypeName
		document.getElementById("gameName").innerText = this.data.SessionInfo.ServerName
		let time = this.data.SessionInfo.serverTime
		document.getElementById("timer").innerText = `${Math.floor(time/60)} mins ${Math.floor(time%60)} secs`
		let d = new Date((this.data.SessionInfo.actualTime + time) * 1000)
		document.getElementById("date").innerText = d.toISOString()
	}

	/**
	 * Update the metrics display cards
	 */
	updateMetricsDisplay() {
		if (!this.processor) return;
		
		const metricsInfo = this.processor.getMetricsInfo();
		
		// Update each metric card
		Object.keys(metricsInfo).forEach(metricName => {
			const metric = metricsInfo[metricName];
			const valueElement = document.getElementById(`${metricName}Value`);
			
			if (valueElement) {
				// Add animation class
				valueElement.classList.add('loading');
				
				// Update value after a brief delay for effect
				setTimeout(() => {
					valueElement.textContent = `${metric.value}${metric.unit}`;
					valueElement.classList.remove('loading');
					
					// Add a color based on the normalized value
					const intensity = metric.normalized / 100;
					const hue = intensity * 120; // 0 (red) to 120 (green)
					valueElement.style.color = `hsl(${hue}, 70%, 50%)`;
				}, Math.random() * 500 + 200);
			}
		});
	}

	updateTimeRange(startTime, endTime=-1) {
		if(endTime < 0) {
			endTime = this.data.SessionInfo.serverTime
		}
		LaserTagVisualizations.updateAllTimeRange(startTime, endTime)
	}

	/**
	 * adds players and teams into the selection filters
	 */
	updateFilterElements() {
		let playerElement = document.getElementById("playerSelect")
		let teamElement = document.getElementById("teamSelect")

		playerElement.innerHTML = `
		<option value="">All Players</option>
		`

		teamElement.innerHTML = `
		<option value="">All Teams</option>
		`
		for (let [key, value] of Object.entries(this.data.PlayerData)) {
			playerElement.innerHTML +=`
			<option value="${key}">${value.playerName}</option>
			`
		}

		for (let [key, value] of Object.entries(this.data.TeamData)) {
			teamElement.innerHTML +=`
			<option value="${key}">${value.teamName}</option>
			`
		}
		
	}

	/**
	 * Show error message
	 */
	showError(message) {
		const errorDiv = document.getElementById('errorMessage');
		
		if (errorDiv) {
			errorDiv.textContent = message;
			errorDiv.classList.add('show');
		}
	}

	/**
	 * Refresh all data and visualizations
	 */
	async refresh() {
		console.log('Refreshing application...');
		await this.init();
	}

	onTeamSelect(e) {
		//todo: update player select to filter on players that have been on the selected team
		//and then update visuals to filter for this team's data only
	}

	onPlayerSelect(e) {
		//todo: update visuals to filter for this player's data only
		//and update team select to show teams this player has been in
	}
}

// Initialize the application when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
	console.log('DOM loaded, starting app...');
	
	// Create global app instance
	window.laserTagApp = new LaserTagApp();
	
	// Initialize the app
	window.laserTagApp.init().catch(error => {
		console.error('Failed to initialize app:', error);
	});
});

// Add some utility functions for development/debugging
window.debugApp = {
	getMetrics: () => window.laserTagApp?.processor?.calculateMetrics(),
	getData: () => window.laserTagApp?.data,
	getProcessor: () => window.laserTagApp?.processor,
	refresh: () => window.laserTagApp?.refresh()
};

function toggleUpload() {
	let hidden = document.getElementById("fileUpload").style.display == "none"
	document.getElementById("fileUpload").style.display = hidden ? "block" : "none"
	if(hidden) {
		document.body.scrollTop = 0
		document.documentElement.scrollTop = 0
	}
}

function resetTimeRange() {
	window.laserTagApp?.updateTimeRange(0)
}

/**
 * Fullscreen Network Graph Functions
 */
function toggleNetworkFullscreen() {
	const modal = document.getElementById('networkFullscreenModal');
	if (!modal) {
		console.error('Fullscreen modal not found');
		return;
	}

	// Show the modal
	modal.classList.add('active');
	
	// Render the network graph in fullscreen
	if (window.laserTagApp && window.laserTagApp.networkGraph) {
		window.laserTagApp.networkGraph.renderFullscreen();
	}
	
	// Add keyboard listener for ESC key
	document.addEventListener('keydown', handleFullscreenKeydown);
	
	// Prevent body scrolling
	document.body.style.overflow = 'hidden';
}

function closeNetworkFullscreen() {
	const modal = document.getElementById('networkFullscreenModal');
	if (!modal) return;
	
	// Hide the modal
	modal.classList.remove('active');
	
	// Clear the fullscreen content
	const container = document.getElementById('nodeGraphFullscreen');
	if (container) {
		container.innerHTML = '';
	}
	
	// Remove keyboard listener
	document.removeEventListener('keydown', handleFullscreenKeydown);
	
	// Restore body scrolling
	document.body.style.overflow = '';
}

function handleFullscreenKeydown(event) {
	if (event.key === 'Escape') {
		event.preventDefault();
		closeNetworkFullscreen();
	}
}

// Handle window resize in fullscreen mode
window.addEventListener('resize', function() {
	const modal = document.getElementById('networkFullscreenModal');
	if (modal && modal.classList.contains('active')) {
		// Re-render the graph with new dimensions
		if (window.laserTagApp && window.laserTagApp.networkGraph) {
			window.laserTagApp.networkGraph.renderFullscreen();
		}
	}
});