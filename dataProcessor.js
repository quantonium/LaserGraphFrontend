/**
 * Data Processing Module for Laser Tag Analytics
 * Processes JSON match data to calculate performance metrics
 */

/**
 * returns true if the value is within the start and end time range
 */

function isWithinTimeRange(value, startTime = 0, endTime = -1) {
	return value >= startTime && 
			(endTime < 0 || value <= endTime)
}

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
	 * Calculate player interaction network data for node graph
	 */
	calculatePlayerNetwork() {
		// Get player data
		const playerData = this.data.PlayerData || {};
		console.log('PlayerData:', playerData);
		console.log('Number of players:', Object.keys(playerData).length);
		
		// Create nodes for each player
		const nodes = Object.entries(playerData).map(([id, data]) => {
			const playerId = parseInt(id);
			const teamId = this.getPlayerTeam(playerId);
			let color = '#3498db'; // default color
			
			console.log(`Player ${id} (${data.playerName}): teamId = ${teamId}`);
			
			// Always prioritize team color for team-based games
			if (teamId > 0 && this.teamData[teamId] && this.teamData[teamId].primaryColor) {
				const teamColor = this.teamData[teamId].primaryColor;
				color = `rgb(${Math.floor(teamColor.r * 255)}, ${Math.floor(teamColor.g * 255)}, ${Math.floor(teamColor.b * 255)})`;
			} else if (data.preferredPrimaryColor) {
				// Only use individual player color if no team assignment (FFA mode or spectators)
				color = `rgb(${Math.floor(data.preferredPrimaryColor.r * 255)}, ${Math.floor(data.preferredPrimaryColor.g * 255)}, ${Math.floor(data.preferredPrimaryColor.b * 255)})`;
			}
			
			return {
				id: id,
				name: data.playerName || `Player ${id}`,
				color: color,
				teamId: teamId
			};
		});

		// Track shot relationships
		const shotCounts = {};
		console.log('Processing hits for network graph, total hits:', this.hits.length);
		
		this.hits.forEach(hit => {
			const shooterId = hit.instigatorStateId?.index?.toString();
			const targetId = hit.hitStateId?.index?.toString();
			
			if (shooterId && targetId && shooterId !== targetId) {
				const key = `${shooterId}-${targetId}`;
				shotCounts[key] = (shotCounts[key] || 0) + 1;
			}
		});

		console.log('Shot counts:', shotCounts);
		console.log('Number of shot relationships:', Object.keys(shotCounts).length);

		// Create links based on shot relationships
		const links = Object.entries(shotCounts).map(([key, count]) => {
			const [source, target] = key.split('-');
			return {
				source: source,
				target: target,
				value: count,
				width: Math.min(Math.max(count * 2, 2), 15) // Increased scaling: count * 2, min 2, max 15
			};
		});

		// Filter out nodes that have no connections
		const connectedNodeIds = new Set();
		links.forEach(link => {
			connectedNodeIds.add(link.source);
			connectedNodeIds.add(link.target);
		});
		
		const connectedNodes = nodes.filter(node => connectedNodeIds.has(node.id));

		console.log('Network data result:');
		console.log('- Nodes:', connectedNodes.length);
		console.log('- Links:', links.length);
		console.log('Connected nodes:', connectedNodes);
		console.log('Links:', links);

		return {
			nodes: connectedNodes,
			links: links
		};
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
	getTeamPerformance( startTime = 0, endTime = -1) {
		const teams = {};
		
		Object.keys(this.teamData).forEach(teamId => {
			const team = this.teamData[teamId];
			
			// Skip spectator teams
			if (team.bTeamIsSpectator) return;
			
			const teamHits = this.hits.filter(hit => {
				// Find hits by players on this team
				const playerId = hit.instigatorStateId?.index;

				return this.getPlayerTeam(playerId) === parseInt(teamId)
				&& isWithinTimeRange(history.hitMatchState.gameTime, startTime, endTime)
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
	 * Build mapping between internal PlayerIDs and PlayerData indices
	 * This helps correlate TeamChange events with actual player data
	 */
	buildPlayerIdMapping() {
		if (this.playerIdMapping) return this.playerIdMapping;
		
		this.playerIdMapping = new Map();
		
		// Get all unique PlayerIDs from TeamChange events
		const teamChangePlayerIds = new Set();
		this.events.filter(event => event.eventName === "TeamChange")
			.forEach(event => {
				if (event.data && event.data.PlayerID !== undefined) {
					teamChangePlayerIds.add(event.data.PlayerID);
				}
			});
		
		// Get all player data indices
		const playerDataIndices = Object.keys(this.playerData).map(id => parseInt(id)).sort((a, b) => a - b);
		
		// Create mapping based on order and patterns
		const sortedTeamChangeIds = Array.from(teamChangePlayerIds).sort((a, b) => a - b);
		
		// If we have the same number of players, map them in order
		if (sortedTeamChangeIds.length >= playerDataIndices.length) {
			for (let i = 0; i < playerDataIndices.length; i++) {
				const playerDataIndex = playerDataIndices[i];
				const teamChangeId = sortedTeamChangeIds[i];
				this.playerIdMapping.set(playerDataIndex, teamChangeId);
			}
		} else {
			// Fallback: map what we can
			for (let i = 0; i < Math.min(playerDataIndices.length, sortedTeamChangeIds.length); i++) {
				const playerDataIndex = playerDataIndices[i];
				const teamChangeId = sortedTeamChangeIds[i];
				this.playerIdMapping.set(playerDataIndex, teamChangeId);
			}
		}
		
		console.log('PlayerID mapping built:', this.playerIdMapping);
		console.log('PlayerData indices:', playerDataIndices);
		console.log('TeamChange PlayerIDs:', sortedTeamChangeIds);
		
		return this.playerIdMapping;
	}

	/**
	 * Get player team assignment by looking at team change events starting at startTime
	 */
	getPlayerTeam(playerId, endTime = -1) {
		if (playerId === undefined || playerId === null) return 0;
		
		// Build player ID mapping if not already done
		this.buildPlayerIdMapping();
		
		// Convert playerData index to internal PlayerID used in events
		const internalPlayerId = this.playerIdMapping.get(parseInt(playerId));
		
		if (internalPlayerId !== undefined) {
			// Look through team change events to find current team
			const teamChangeEvents = this.events.filter(event => 
				event.eventName === "TeamChange" && 
				event.data && event.data.PlayerID === internalPlayerId &&
				isWithinTimeRange(event.matchState.gameTime, 0, endTime)
			);
			
			if (teamChangeEvents.length > 0) {
				const lastChange = teamChangeEvents[teamChangeEvents.length - 1];
				const teamId = parseInt(lastChange.data.new || 0);
				console.log(`Player ${playerId} (PlayerData) -> ${internalPlayerId} (TeamChange) -> team ${teamId}`);
				return teamId;
			}
		}
		
		// Try direct lookup as fallback
		const directLookup = this.events.filter(event => 
			event.eventName === "TeamChange" && 
			event.data && event.data.PlayerID === parseInt(playerId) &&
			isWithinTimeRange(event.matchState.gameTime, startTime, endTime)
		);
		
		if (directLookup.length > 0) {
			const lastChange = directLookup[directLookup.length - 1];
			const teamId = parseInt(lastChange.data.new || 0);
			console.log(`Player ${playerId} (direct lookup) -> team ${teamId}`);
			return teamId;
		}

		// Smart team assignment for players without explicit TeamChange events
		// Skip player 10 (human player) and assign bots to teams alternately
		if (parseInt(playerId) === 10) {
			console.log(`Player ${playerId} (human player) -> team 0 (spectator)`);
			return 0; // Human player as spectator
		}
		
		// For bot players, assign alternately to team 1 and 2
		// Skip players that already have explicit assignments
		const explicitlyAssignedPlayers = new Set();
		this.playerIdMapping.forEach((internalId, playerDataIndex) => {
			explicitlyAssignedPlayers.add(playerDataIndex);
		});
		
		if (!explicitlyAssignedPlayers.has(parseInt(playerId))) {
			const botTeam = (parseInt(playerId) % 2) + 1; // Alternates between 1 and 2
			console.log(`Player ${playerId} (auto-assigned bot) -> team ${botTeam}`);
			return botTeam;
		}
		
		console.log(`Player ${playerId} -> team 0 (default)`);
		return 0; // Default team
	}

	getPointInfoForHit(hitIndex = -1){
		
		const eventsWithHitInfo = this.events.filter(event => event.data?.HitID === hitIndex)
		let playerPointsDelta = new Map()
		let playerPointFinal = new Map()

		let teamPointsDelta = new Map()
		let teamPointFinal = new Map()


		eventsWithHitInfo.forEach((event, index) => {
			switch(event.eventName) {
				case "TeamPointsChange":
					let deltaTeam = event.data.new - event.data.old
					teamPointsDelta.set(event.data?.ID, deltaTeam)
					teamPointFinal.set(event.data?.ID, event.data.new)
					break;
				case "PlayerScore":
					let delta = event.data.newScore - event.data.oldScore
					playerPointsDelta.set(event.data.ID, delta)
					playerPointFinal.set(event.data.ID, event.data.newScore)
					break;
			}
		})
		return {
			playerDelta: playerPointsDelta,
			playerFinal: playerPointFinal,
			teamDelta: teamPointsDelta,
			teamFinal: teamPointFinal
		}
	}

	/**
	 * Get player statistics
	 */
	getPlayerStats(startTime = 0, endTime = -1) {
		const players = {};
		const hitsInRange = this.hits.filter(hit =>  isWithinTimeRange(hit.hitMatchState.gameTime, startTime, endTime))
		Object.keys(this.playerData).forEach(playerId => {
			const player = this.playerData[playerId];
			const playerHits = this.hitsInRange.filter(hit => hit.instigatorStateId?.index === parseInt(playerId));
			const playerGotHit = this.hitsInRange.filter(hit => hit.hitStateId?.index === parseInt(playerId));
			const playerScoreDelta = playerHits

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
