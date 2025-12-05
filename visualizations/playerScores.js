class LaserTagLeaderboard extends LaserTagVisualizations {

	static updatePlayerData(playerData, scores = Map(), teams = Map()) {
		for(let player of playerData) {
			if(scores.has(player.id)) {
				player.score = scores.get(player.id)
			}
			player.team = teams.get(player.id)
		}
		return playerData.sort((a,b) => b.score - a.score)
	}

	loadData(processor) {
		let container = this.getContainer()
		let hits = processor.hits

		// Prepare data
		const timelineData = hits.map((hit, index) => ({
			time: hit.hitMatchState?.gameTime || 0,
			points: (hit.basePointValue || 0) * (hit.pointMultiplier || 1),
			multiplier: hit.pointMultiplier || 1,
			component: hit.hitComponent || 'Unknown',
			index: index,
			shooterId: hit.instigatorStateId?.index,
			targetId: hit.hitStateId?.index,
			hitFriendlyName: hit.hitFriendlyName || 'Unknown Target',
			hitAbbreviation: hit.hitAbbreviation || 'UNK',
			basePoints: hit.basePointValue || 0,
			pointInfo: processor.getPointInfoForHit(hit.hitIndex)
		})).sort((a, b) => a.time - b.time);

		// Store data for highlighting
		this.currentTimelineData = timelineData;

		const playerData = Object.entries(processor.playerData).map((player, index) => ({
			id: index,
			name: player[1].playerName,
			team: processor.getPlayerTeam(index) == -1 ? null : processor.teamData[processor.getPlayerTeam(index)],
			score: 0
		})).sort((a, b) => b.score - a.score)

		this.currentPlayerData = playerData

		const resetEvents = processor.events.filter((event) => event.eventName == "PlayerDataReset")

		this.scoreResetData = resetEvents

		this.processor = processor

		this.updateElement()
	}

	updateElement() {
		this.getContainer().innerHTML = ""
		for (let data of this.currentPlayerData) {
			let r = document.createElement("tr")
			r.id = "player_" + data.id
			
			// Apply team color as background with transparency and border
			if (data.team && data.team.primaryColor) {
				const color = data.team.primaryColor;
				const alpha = 0.15; // Light background transparency
				const borderAlpha = 0.8; // Stronger border opacity
				r.style.backgroundColor = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${alpha})`;
				r.style.borderLeftColor = `rgba(${Math.floor(color.r * 255)}, ${Math.floor(color.g * 255)}, ${Math.floor(color.b * 255)}, ${borderAlpha})`;
			}
			
    		let name = document.createElement("td")
			name.innerText = data.name
			r.appendChild(name)

			let team = document.createElement("td")
			team.innerText = data.team == null ? "" : data.team.teamName
			r.appendChild(team)

			let score = document.createElement("td")
			score.innerText = data.score
			r.appendChild(score)

			this.getContainer().appendChild(r)
		}
	}

	createFullscreen(data, container, detailsContainer) {
		
	}

	highlightTimeRange(startTime = 0, endTime = -1) {
		if(endTime >= 0) {
			document.getElementById("matchTime").innerText = `${Math.round(endTime/60)}:${Math.floor(endTime%60)}.${Math.round((endTime % 1) * 1000)}`
		}

		if (!this.currentTimelineData || !this.currentPlayerData) {
			return;
		}
		const filteredEvents = this.currentTimelineData.filter((event) => isWithinTimeRange(event.time, 0, endTime))
		const filteredResets = this.scoreResetData.filter((event) => isWithinTimeRange(event.matchState.gameTime, 0, endTime))

		const playerScores = new Map()
		const playerScoreUpdate = new Map()

		for(let i = filteredEvents.length - 1; i >= 0; i--) {
			let pointsMap = filteredEvents[i].pointInfo.playerFinal
			for(const [key, value] of pointsMap) {
				if(!playerScores.has(key)) {
					playerScores.set(key, value)
					playerScoreUpdate.set(key, filteredEvents[i].time)
				}
			}
		}

		for(let j = 0; j < filteredResets.length - 1; j++) {
			let id = filteredResets[j].data.PlayerID
			if(!playerScores.has(id) || filteredResets[j].matchState.gameTime > playerScoreUpdate.get(id)) {
				playerScores.set(id, 0)
				playerScoreUpdate.set(id, filteredResets[j].matchState.gameTime)
			}
		}

		const playerTeams = new Map()

		for(let p of this.currentPlayerData) {
			let team = this.processor.getPlayerTeam(p.id, endTime)
			if(team != -1)
				playerTeams.set(p.id, this.processor.teamData[team])
			else playerTeams.set(p.id, null)
		}

		this.currentPlayerData = LaserTagLeaderboard.updatePlayerData(this.currentPlayerData, playerScores, playerTeams)

		this.updateElement()
	}
}