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
        
        // Initialize file upload handlers
        this.initFileUpload();
    }

    /**
     * Initialize the application UI (no automatic data loading)
     */
    async init() {
        console.log('Laser Tag Analytics App ready for data upload...');
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
        if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
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
            
            // Create visualizations
            this.createVisualizations();
            
            // Update metrics display
            this.updateMetricsDisplay();
            
            console.log('Data processed and visualizations created successfully!');
            
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
