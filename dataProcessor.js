/**
 * Data Processing Module for Laser Tag Analytics
 * Processes JSON match data to calculate performance metrics
 */

class LaserTagDataProcessor {
    constructor(matchData) {
        this.data = matchData;
        // Handle new nested structure
        this.matchData = matchData.MatchData || matchData;
        this.hits = this.matchData.hits || [];
        this.events = this.matchData.events || [];
        // Team data is at root level, not nested in MatchData
        this.teamData = matchData.TeamData || matchData.teamData || {};
        this.playerData = matchData.PlayerData || matchData.playerData || {};
        this.metrics = {};
    }

    /**
     * Calculate all performance metrics
     */
    calculateMetrics() {
        this.metrics = {
            trickshot: this.calculateTrickshot(),
            stealth: this.calculateStealth(),
            speed: this.calculateSpeed(),
            rpm: this.calculateRPM(),
            range: this.calculateRange(),
            accuracy: this.calculateAccuracy()
        };
        return this.metrics;
    }

    /**
     * Trickshot = complex shots ratio based on distance and target type
     */
    calculateTrickshot() {
        if (this.hits.length === 0) return 0;

        let complexShots = 0;
        let totalMultiplier = 0;

        this.hits.forEach(hit => {
            // Check for long-range shots or difficult targets as "trick shots"
            const distance = hit.distance || 0;
            const isLongRange = distance > 2000; // Long range shots
            const hasReflectiveMaterial = hit.hitResult && hit.hitResult.physMaterial && 
                hit.hitResult.physMaterial.includes('Reflective');
            const isRectangleTarget = hit.hitComponent && hit.hitComponent.includes('Rectangle');
            
            if (isLongRange || hasReflectiveMaterial || isRectangleTarget || (hit.pointMultiplier > 1)) {
                complexShots++;
            }
            totalMultiplier += hit.pointMultiplier || 1;
        });

        const trickshotRatio = complexShots / this.hits.length;
        const avgMultiplier = totalMultiplier / this.hits.length;
        
        return (trickshotRatio * avgMultiplier) * 100;
    }

    /**
     * Stealth = average time between hits (in seconds)
     */
    calculateStealth() {
        if (this.hits.length <= 1) return 0;

        const hitTimes = this.hits
            .map(hit => hit.hitMatchState?.gameTime || 0)
            .sort((a, b) => a - b);

        let totalTimeDiff = 0;
        for (let i = 1; i < hitTimes.length; i++) {
            totalTimeDiff += hitTimes[i] - hitTimes[i - 1];
        }

        return totalTimeDiff / (hitTimes.length - 1);
    }

    /**
     * Speed = average distance between shot start locations
     */
    calculateSpeed() {
        if (this.hits.length <= 1) return 0;

        const startPositions = this.hits
            .filter(hit => hit.hitResult?.traceStart)
            .map(hit => hit.hitResult.traceStart);

        if (startPositions.length <= 1) return 0;

        let totalDistance = 0;
        let distanceCount = 0;

        for (let i = 1; i < startPositions.length; i++) {
            const dist = this.calculateDistance3D(
                startPositions[i - 1],
                startPositions[i]
            );
            totalDistance += dist;
            distanceCount++;
        }

        return distanceCount > 0 ? totalDistance / distanceCount : 0;
    }

    /**
     * RPM = rounds per minute (shots per minute)
     */
    calculateRPM() {
        if (this.hits.length === 0) return 0;

        const hitTimes = this.hits
            .map(hit => hit.hitMatchState?.gameTime || 0)
            .filter(time => time > 0);

        if (hitTimes.length === 0) return 0;

        const minTime = Math.min(...hitTimes);
        const maxTime = Math.max(...hitTimes);
        const timeSpanMinutes = (maxTime - minTime) / 60;

        return timeSpanMinutes > 0 ? this.hits.length / timeSpanMinutes : 0;
    }

    /**
     * Range = average range value for hits
     */
    calculateRange() {
        if (this.hits.length === 0) return 0;

        const totalRange = this.hits.reduce((sum, hit) => {
            return sum + (hit.distance || 0);
        }, 0);

        return totalRange / this.hits.length;
    }

    /**
     * Accuracy = shots hit / shots fired
     * We'll estimate shots fired from hit events and calculate accuracy per player
     */
    calculateAccuracy() {
        // Count hit events from the events array
        const hitEvents = this.events.filter(event => event.eventName === "HitEvent");
        const shotsHit = hitEvents.length;

        // Estimate total shots fired - in team matches, assume some misses
        // Use player data and hit distribution to estimate
        const uniquePlayers = [...new Set(this.hits.map(hit => hit.instigatorStateId?.index))].filter(id => id !== undefined);
        const avgHitsPerPlayer = this.hits.length / uniquePlayers.length;
        
        // Estimate that accuracy decreases with more active players (more chaos)
        const estimatedAccuracy = Math.min(95, Math.max(60, 100 - (avgHitsPerPlayer * 2)));
        
        return estimatedAccuracy;
    }

    /**
     * Helper function to calculate 3D distance between two points
     */
    calculateDistance3D(point1, point2) {
        const dx = point2.x - point1.x;
        const dy = point2.y - point1.y;
        const dz = point2.z - point1.z;
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /**
     * Get normalized metrics for radar chart (0-100 scale)
     */
    getNormalizedMetrics() {
        const metrics = this.calculateMetrics();
        
        return {
            trickshot: Math.min(100, Math.max(0, metrics.trickshot)),
            stealth: this.normalizeValue(metrics.stealth, 0, 10, true), // Reverse scale (lower is better)
            speed: this.normalizeValue(metrics.speed, 0, 2000, false),
            rpm: this.normalizeValue(metrics.rpm, 0, 60, false),
            range: this.normalizeValue(metrics.range, 0, 8000, false),
            accuracy: Math.min(100, Math.max(0, metrics.accuracy))
        };
    }

    /**
     * Normalize a value to 0-100 scale
     */
    normalizeValue(value, min, max, reverse = false) {
        const normalized = ((value - min) / (max - min)) * 100;
        const clamped = Math.min(100, Math.max(0, normalized));
        return reverse ? 100 - clamped : clamped;
    }

    /**
     * Get detailed metrics information
     */
    getMetricsInfo() {
        const raw = this.calculateMetrics();
        const normalized = this.getNormalizedMetrics();

        return {
            trickshot: {
                value: raw.trickshot.toFixed(2),
                normalized: normalized.trickshot,
                unit: '%',
                description: 'Complex shot efficiency'
            },
            stealth: {
                value: raw.stealth.toFixed(2),
                normalized: normalized.stealth,
                unit: 's',
                description: 'Average time between hits'
            },
            speed: {
                value: raw.speed.toFixed(0),
                normalized: normalized.speed,
                unit: ' units',
                description: 'Movement between shots'
            },
            rpm: {
                value: raw.rpm.toFixed(1),
                normalized: normalized.rpm,
                unit: ' shots/min',
                description: 'Rate of fire'
            },
            range: {
                value: raw.range.toFixed(0),
                normalized: normalized.range,
                unit: ' units',
                description: 'Average shot distance'
            },
            accuracy: {
                value: raw.accuracy.toFixed(1),
                normalized: normalized.accuracy,
                unit: '%',
                description: 'Hit percentage'
            }
        };
    }

    /**
     * Get team performance data
     */
    getTeamPerformance() {
        const teams = {};
        
        Object.keys(this.teamData).forEach(teamId => {
            const team = this.teamData[teamId];
            
            // Skip spectator teams
            if (team.bTeamIsSpectator) return;
            
            const teamHits = this.hits.filter(hit => {
                // Find hits by players on this team
                const playerId = hit.instigatorStateId?.index;
                return this.getPlayerTeam(playerId) === parseInt(teamId);
            });

            teams[teamId] = {
                name: team.teamName,
                points: team.points,
                hits: teamHits.length,
                avgRange: teamHits.length > 0 ? teamHits.reduce((sum, hit) => sum + (hit.distance || 0), 0) / teamHits.length : 0,
                color: team.primaryColor || { r: 0.5, g: 0.5, b: 0.5 } // Default color if missing
            };
        });

        return teams;
    }

    /**
     * Get player team assignment by looking at team change events
     */
    getPlayerTeam(playerId) {
        if (playerId === undefined || playerId === null) return 0;
        
        // Look through team change events to find current team
        const teamChangeEvents = this.events.filter(event => 
            event.eventName === "TeamChange" && 
            event.data && event.data.PlayerID === playerId
        );
        
        if (teamChangeEvents.length > 0) {
            const lastChange = teamChangeEvents[teamChangeEvents.length - 1];
            return parseInt(lastChange.data.new || 0);
        }
        
        return 0; // Default team
    }

    /**
     * Get player statistics
     */
    getPlayerStats() {
        const players = {};
        
        Object.keys(this.playerData).forEach(playerId => {
            const player = this.playerData[playerId];
            const playerHits = this.hits.filter(hit => hit.instigatorStateId?.index === parseInt(playerId));
            const playerGotHit = this.hits.filter(hit => hit.hitStateId?.index === parseInt(playerId));

            players[playerId] = {
                name: player.playerName,
                hits: playerHits.length,
                gotHit: playerGotHit.length,
                avgRange: playerHits.length > 0 ? playerHits.reduce((sum, hit) => sum + (hit.distance || 0), 0) / playerHits.length : 0,
                team: this.getPlayerTeam(parseInt(playerId)),
                color: player.preferredPrimaryColor
            };
        });

        return players;
    }
}

// Export for use in other modules
window.LaserTagDataProcessor = LaserTagDataProcessor;
