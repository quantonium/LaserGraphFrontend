/**
 * Main Application Module
 * Coordinates data loading, processing, and visualization
 */

class LaserTagApp {
    constructor() {
        this.processor = null;
        //this.visualizations = new LaserTagVisualizations();
        this.data = null;

        //visualizations
        this.hitTimeline = new LaserTagHitTimeline("timelineChart");
        this.hexChart = new LaserTagHexagon("hexChart");
        this.networkGraph = new LaserTagNetworkGraph("nodeGraph");
        this.scoreProgression = new LaserTagScoreProgression("scoreChart")
        this.targetDist = new LaserTagTargetDistribution("targetChart")
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Laser Tag Analytics App...');
            
            // Show loading indicators
            this.showLoading();
            
            // Load the JSON data
            await this.loadData();
            
            // Process the data
            this.processData();
            
            // Create visualizations
            this.createVisualizations();
            
            // Update metrics display
            this.updateMetricsDisplay();
            
            console.log('App initialized successfully!');
            
        } catch (error) {
            console.error('Error initializing app:', error);
            this.showError('Failed to load or process data. Please check the console for details.');
        }
    }

    /**
     * Load JSON data from file
     */
    async loadData() {
        try {
            const response = await fetch('./sample-match-data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            console.log('Data loaded successfully:', this.data);
        } catch (error) {
            console.error('Error loading data:', error);
            throw error;
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

    /**
     * Show loading indicators
     */
    showLoading() {
        // Add loading class to metric values
        const metricValues = document.querySelectorAll('[id$="Value"]');
        metricValues.forEach(element => {
            element.innerHTML = '<div class="loading"></div>';
        });
        
        // Add loading message to chart containers
        const chartContainers = document.querySelectorAll('.chart-container canvas, .chart-container div[id$="Chart"]');
        chartContainers.forEach(container => {
            if (container.tagName === 'CANVAS') return; // Skip canvas elements
            container.innerHTML = '<p style="text-align: center; color: #7f8c8d; padding: 40px;"><div class="loading" style="margin: 0 auto 20px;"></div>Loading data...</p>';
        });
    }

    /**
     * Show error message
     */
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.style.cssText = `
            background: #e74c3c;
            color: white;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
            text-align: center;
            font-weight: bold;
        `;
        errorDiv.textContent = message;
        
        const container = document.querySelector('.container');
        container.insertBefore(errorDiv, container.firstChild);
    }

    /**
     * Refresh all data and visualizations
     */
    async refresh() {
        console.log('Refreshing application...');
        await this.init();
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
