import { courseGen, mainList, presetList, levels, Level, resetLevels } from './levels.js'
import { ModalFormData, ActionFormData } from '@minecraft/server-ui'
import { world, system, MolangVariableMap } from '@minecraft/server'

export let difficulty = 1
export let preset = 'Random'

export const overworld = world.getDimension( 'overworld' )
let setTimer = 10, timer = 12000, overtime = false, overtimeTime = 600, running = false, ticks = 0, forceStop = false

const teams = new Map( [
	[ 'red',    { name: 'Red Rabbits',    score: 0, unicode: '', multiplier: 1 } ],
	[ 'orange', { name: 'Orange Ocelots', score: 0, unicode: '', multiplier: 1 } ],
	[ 'yellow', { name: 'Yellow Yaks',    score: 0, unicode: '', multiplier: 1 } ],
	[ 'lime',   { name: 'Lime Llamas',    score: 0, unicode: '', multiplier: 1 } ],
	[ 'green',  { name: 'Green Geckos',   score: 0, unicode: '', multiplier: 1 } ],
	[ 'cyan',   { name: 'Cyan Cyotes',    score: 0, unicode: '', multiplier: 1 } ],
	[ 'aqua',   { name: 'Aqua Axolotls',  score: 0, unicode: '', multiplier: 1 } ],
	[ 'blue',   { name: 'Blue Bats',      score: 0, unicode: '', multiplier: 1 } ],
	[ 'purple', { name: 'Purple Pandas',  score: 0, unicode: '', multiplier: 1 } ],
	[ 'pink',   { name: 'Pink Parrots',   score: 0, unicode: '', multiplier: 1 } ]
] )

const levelMedals = {
	'M1': 'checkpoint',
	'M2': 'stone',
	'M3': 'stone',
	'B1': 'checkpoint',
	'B2': 'bronze',
	'B3': 'silver',
	'BF': 'gold',
	'End': 'end',
	'Easy': 'checkpoint',
	'Medium': 'checkpoint',
	'Hard': 'checkpoint'
}


const sections = [ 'I1', 'I2', 'I3', 'I4', 'I5', 'I6' ]
let endDiff = ['Easy', 'Medium', 'Hard']

class Contestant {
	constructor( player ) {
		this.playerName = player.name
        this.stone = 0
		this.bronze = 0
		this.silver = 0
		this.gold = 0
        this.end = 0
		this.finished = false
        this.team = 'none'
		this.island = 'I1'
		this.score = 0
		
		for ( const tag of player.getTags() ) player.removeTag( tag )
		runCommands( [ 'tp 0 0 0', 'clear @s', 'replaceitem entity @s slot.hotbar 0 compass 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' ], player )
		runCommands( running == false ? ['gamemode a'] : ['gamemode spectator'], player )
	
		runCommands( [ 'replaceitem entity @s slot.hotbar 1 comparator 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }', 'replaceitem entity @s slot.hotbar 2 clock 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' ], player )
	}
	completeCourse() {
		const [ player ] = overworld.getPlayers( { name: this.playerName } )
		this.score = this.stone * 2 + [0, 5, 15, 25, 40, 60][this.bronze] + [0, 10, 25, 45, 70, 100][this.silver] + [0, 15, 30, 55, 90, 140][this.gold]
		this.finished = true
		if ( this.end == 0 ) {
			runCommands( [ `tellraw @s { "rawtext": [ { "text": "You died during overtime!" } ] }`, 'playsound mcc:fail @s ~~~' ], player )
		} else {
			player.runCommandAsync( `tellraw @s { "rawtext": [ { "text": "You finished the course!" } ] }` )
		}

		[ 'compass', 'comparator', 'clock' ].forEach( ( item, index ) => { 
			player.runCommandAsync( `replaceitem entity @s slot.hotbar ${index} ${item} 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` )
		} )

		runCommands( 
			[`gamemode spectator @s`, 'replaceitem entity @s slot.hotbar 0 compass 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }', `replaceitem entity @s slot.hotbar 8 ${ [ 'glass', 'copper_block', 'iron_block', 'gold_block' ][ this.end ] } 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` ], player )

		for ( const tag of player.getTags() ) player.removeTag( tag )  
		if ( players.filter( player => !player.finished && player.team != 'none' ).length == 0 ) { timer = 2; overtime = true }
	}
}

// Plater data upon joining and leaving

let players = []
for ( const player of world.getAllPlayers() ) {
	players.push( new Contestant( player ) )
}

world.afterEvents.playerJoin.subscribe( async data => {
	const searchPlayer = () => {

		const [ player ] = overworld.getPlayers( { name: data.playerName } )
		if ( !player ) return system.runTimeout( () => { searchPlayer() }, 10 )
		if ( players.filter( player => player.playerName == data.playerName ).length > 0 ) return

		players.push( new Contestant( player ) )
		if ( world.getPlayers().length == 1 ) overworld.runCommandAsync( 'fill -7 7 34 7 7 34 barrier' )
	}
	searchPlayer()
} ) 

world.beforeEvents.playerLeave.subscribe( async data => {
	players = players.filter( player => player.playerName != data.player.name )
} ) 

// Player Data + Checkpoint Functionality

const tick = () => system.run( () => {
	for ( const playerData of players ) {
		const milliseconds = ( timer * 5 ) % 100 < 10 ? '0' + ( timer * 5 ) % 100 : timer < 0 ? '00': ( timer * 5 ) % 100
        const seconds      = Math.floor( timer / 20 ) % 60 < 10 ? '0' + Math.floor( timer / 20 ) % 60 : timer < 0 ? '00': Math.floor( timer / 20 ) % 60
        const minutes      = Math.floor( timer / 1200 ) % 60 < 10 ? '0' + Math.floor( timer / 1200 ) % 60 : timer < 0 ? '00': Math.floor( timer / 1200 ) % 60
		
		if ( overworld.getPlayers( { name: playerData.playerName } )[0] == undefined ) continue
		const [ player ] = overworld.getPlayers( { name: playerData.playerName } ) 
		
		const [ armorStand ] = overworld.getEntities( { type: 'minecraft:armor_stand', location: player.location, closest: 1, maxDistance: 5 } )
		const [ islandStand ] = overworld.getEntities( { name: playerData.island, type: 'minecraft:armor_stand' } )
		const islandLocation = { ...islandStand.location, x: islandStand.location.x - 5, z: islandStand.location.z + 10 } 
		
		player.onScreenDisplay.setActionBar( `${minutes}:${seconds}.${milliseconds}` )

		if ( !playerData.finished && playerData.team != 'none' ) {
			if ( armorStand ) if ( !player.hasTag( armorStand.nameTag ) && player.isOnGround ) {
				switch ( levelMedals[ armorStand.nameTag ] ) {
					case 'checkpoint': 
						switch ( armorStand.nameTag ) {
							case 'M1': player.onScreenDisplay.setTitle( !player.hasTag('I6') ? levels.filter( level => level.bonus == 'M1' && level.island == playerData.island)[0].title : levels.filter( level => level.bonus == 'B1' && level.island == playerData.island )[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } ); break
							case 'B1': player.onScreenDisplay.setTitle( !player.hasTag('I6') ? levels.filter( level => level.bonus == 'B1' && level.island == playerData.island)[0].title : levels.filter( level => level.bonus == 'B2' && level.island == playerData.island )[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } ); break
							default: 
								[ 'Easy', 'Medium', 'Hard' ].forEach( element => player.removeTag( element ) )
								playerData.island = armorStand.nameTag
								if ( timer > 600 && !overtime ) player.runCommandAsync( 'replaceitem entity @s slot.hotbar 0 redstone 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' )
							}
						[ 'M1', 'B1' ].forEach( element => { player.removeTag( element ) } )
						break
					case 'stone': 
						switch( armorStand.nameTag ) {
							case 'M2': player.onScreenDisplay.setTitle( levels.filter( level => level.bonus == 'M2' && level.island == player.getTags().filter( tag => sections.includes(tag))[0])[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } ); break
							case 'M3': player.onScreenDisplay.setTitle( levels.filter( level => level.bonus == 'M3' && level.island == player.getTags().filter( tag => sections.includes(tag))[0])[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } ); break
						}
						player.playSound( 'mcc:score_regular', { location: player.location, volume: 0.3 } )
						playerData.stone++
						player.runCommandAsync( `replaceitem entity @s slot.hotbar 4 coal ${playerData.stone} 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` )
						break
					case 'bronze': 
						player.playSound( 'mcc:score_regular', { location: player.location, volume: 0.3 } )
						player.onScreenDisplay.setTitle( levels.filter( level => level.bonus == 'B2' && level.island == player.getTags().filter( tag => sections.includes(tag) )[0])[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } )
						playerData.bronze++
						player.runCommandAsync( `replaceitem entity @s slot.hotbar 5 copper_ingot ${playerData.bronze} 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` )
						break
					case 'silver': 
						player.playSound( 'mcc:score_regular', { location: player.location, volume: 0.3 } )
						player.onScreenDisplay.setTitle( levels.filter( level => level.bonus == 'B3' && level.island == player.getTags().filter( tag => sections.includes(tag) )[0])[0].title, { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 30 } )
						playerData.silver++
						player.runCommandAsync( `replaceitem entity @s slot.hotbar 6 iron_ingot ${playerData.silver} 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` ) 
						break
					case 'gold': 
						player.teleport ( islandLocation, { rotation: islandStand.getRotation() } )
						system.runTimeout( () => {
							 player.playSound( 'mcc:score_big', { location: player.location, volume: 0.3 } )
							 player.setSpawnPoint( { ...islandLocation, dimension: overworld} )
							}, 5 )
						playerData.gold++
						player.runCommandAsync( `replaceitem entity @s slot.hotbar 7 gold_ingot ${playerData.gold} 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` )
						break
					case 'end': 
						playerData.end = player.hasTag( 'Easy' ) ? 1 : player.hasTag( 'Medium' ) ? 2 : 3
						system.runTimeout( () => { player.playSound( 'mcc:course_finish', {location: player.location, volume: 0.5 } ) }, 5 )
						playerData.completeCourse()
						break
					default:
						for ( const tag of player.getTags() ) player.removeTag( tag )
						if ( [ 'I2','I3','I4','I5','I6' ].includes( armorStand.nameTag ) ) {
							player.runCommandAsync( 'replaceitem entity @s slot.hotbar 0 redstone 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' )
							playerData.island = armorStand.nameTag
							player.playSound( 'mcc:score_regular', { location: player.location, volume: 0.3 } )
							playerData.stone++
							player.runCommandAsync( `replaceitem entity @s slot.hotbar 4 coal ${playerData.stone} 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` )
						}
				}
				player.setSpawnPoint( {...armorStand.location, dimension: overworld } )
				player.addTag( armorStand.nameTag )
			}
			
			if ( player.location.y < player.getSpawnPoint().y - 20 ) !overtime ? player.teleport( player.getSpawnPoint(), { rotation: overworld.getEntities( { location: { x: player.getSpawnPoint().x, y: player.getSpawnPoint().y, z: player.getSpawnPoint().z}, closest: 1, type: 'minecraft:armor_stand' } )[0].getRotation() } ) : playerData.completeCourse()
			if ( timer == 0 && !overtime ) player.onScreenDisplay.setTitle( 'Overtime!', { fadeInDuration: 5, fadeOutDuration: 5, stayDuration: 10 } )
			if (timer == 800 && !overtime) {
				player.runCommandAsync( `tellraw @s { "rawtext": [ { "text":"Redstone is being taken away in 10 seconds!" }]}` )
				player.playSound( 'mcc:alert', { location: player.location, volume: 0.3 } )
			}
			if ( (timer <= 600 || overtime) && player.getTags().includes( 'I6' ) ) player.runCommandAsync( 'replaceitem entity @s slot.hotbar 0 barrier 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' )
			if ( timer == 0 && overtime ) playerData.completeCourse()
		}
	}

	if ( timer == 0 ) {
		if ( overtime ) return displayLeaderboard()
		world.playMusic( 'mcc:overtime_intro', { fade: 1, loop: false, volume: 1 } )
		system.runTimeout( () => { if ( timer > 100 ) world.playMusic( 'mcc:overtime_loop', { fade: 1, loop: false, volume: 1 } ) }, 60 )

		overtime = true
		timer += overtimeTime
	}
	timer--
	ticks++

	let islands = []
	sections.forEach( island => { if ( overworld.getPlayers().filter( player => player.hasTag( island ) ).length > 0 ) islands.push( island ) } )

	obstacles( islands )
	tick()
} )

// Item Functionality

let presetChoices = [ ...Object.keys( presetList ), 'Previous' ]
let presetID = 0
let teamKey = [ 'none', ...teams.keys() ]

world.afterEvents.itemUse.subscribe( data => {
    const player = data.source
	const [ playerData ] = players.filter( contestant => contestant.playerName == player.name )
	const [ islandStand ] = overworld.getEntities( { name: endDiff.includes( playerData.island ) ? 'I6' : playerData.island, type: 'minecraft:armor_stand' } )
	const islandLocation =  player.hasTag('I6') ? { ...islandStand.location } : { ...islandStand.location, x: islandStand.location.x - 5, z: islandStand.location.z + 10 } 

	switch( data.itemStack.typeId ) {
		case 'minecraft:comparator': 

			const levelModal = new ModalFormData()
			.title( 'Course Editor' )
			.dropdown( 'Preset', presetChoices, preset == 'Previous' ? presetChoices.indexOf( 'Previous' ) : presetID )
			.dropdown( 'Difficulty [If Random]', [ 'Easy', 'Medium', 'Hard' ], difficulty )
			.slider( 'Timer', 0, 20, 1, setTimer )
			.slider( 'Overtime', 0, 600, 30, overtimeTime/20 )

			levelModal.show( player ).then( levelGen => {
				const [ newPreset, newDifficulty, newTimer, newOvertime ] = levelGen.formValues
				
				if ( running ) return

				difficulty = newDifficulty

				setTimer = newTimer
				timer = setTimer * 1200

				overtimeTime = newOvertime * 20
				
				if ( presetChoices[ newPreset ] == 'Previous' ) if ( levels.length == 0 ) { 
					overworld.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "Invalid Preset, defaulting to 'Random'." } ] }` )
					newPreset = 0
				} else overworld.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "The course will not change!" } ] }` )

				if ( newPreset != 0 && presetChoices[ newPreset ] != 'Previous' ) overworld.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "Bonus Paths set to ${presetChoices[ newPreset ]}!" } ] }` )
				if ( newPreset == 0 ) overworld.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "Bonus Paths set to Random ${['Easy', 'Medium', 'Hard'][ newDifficulty ]}!" } ] }` )
				
				preset = presetChoices[ newPreset ]
				presetID = newPreset
			
			} )
			break

		case 'minecraft:compass': 
			const playerModal = new ModalFormData() 
			.title( 'Team Editor' )
			.dropdown( 'Choose Your Team', [ 'None', ...[ ...teams.values() ].map( team => `${team.name}` ) ], teamKey.indexOf( playerData.team )  )

			playerModal.show( player ).then( teamSelect => {
				const [ team ] = teamSelect.formValues

				if ( running ) return
				if ( players.filter( player => player.team == teamKey[ team ] ).length == 4 ) return player.runCommandAsync( `tellraw @s { "rawtext": [ { "text": "That team is full!" } ] }` )
				
				if ( team == 0 ) player.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "${playerData.playerName} has opted out of the event!" } ] }` )
				else if ( playerData.team != teamKey[ team ] ) player.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "${playerData.playerName} joined the ${ teams.get( teamKey[ team ] ).name }!" } ] }` ) 
				playerData.team = teamKey[ team ]

			} )
			break

		case 'minecraft:clock':
			if ( running ) return
			if ( players.filter( player => player.team != 'none' ).length == 0 ) return overworld.runCommandAsync( `tellraw @a { "rawtext": [ { "text": "Not enough players!" } ] }` )

			running = true
			let killStand = [ 'B2', 'B3', 'BF', 'End' ] 

			if ( preset != 'Previous' ) {
				overworld.runCommandAsync( 'kill @e[ x = -45, dx = 94, y = -2, dy = 50, z = 951, dz = 60, name = B1 ]')
				killStand.forEach( element => overworld.runCommandAsync( `kill @e[ name = ${element} ]` ) )
				resetLevels()
				courseGen()
				levels.forEach( ( { title, id, bonus, island, x, y, z } ) => overworld.runCommandAsync( `structure load ${id} ${x} ${y} ${z}` ) )
				mainList.forEach( main => levels.push( new Level( main ) ) )
			}

			preset = 'Previous'

			for ( const all of world.getPlayers() ) { 
				all.teleport( { x: 0, y: 6, z: 32 } )  
				all.addTag( 'I1' )
				if ( players.filter( player => all.name == player.playerName )[0].team == 'none' ) all.runCommandAsync( 'gamemode spectator' )
			}

			system.runTimeout( () => {
				runCommands( [ 'clear @a', 'title @a title 3', 'execute @a ~~~ playsound mcc:countdown_high @a 0 6 32' ], overworld )
			}, 40 )
			system.runTimeout( () => { 
				runCommands( [ 'title @a title 2', 'execute @a ~~~ playsound mcc:countdown_high @a 0 6 32 1' ], overworld )
			}, 60 )
			system.runTimeout( () => { 
				runCommands( [ 'title @a title 1', 'execute @a ~~~ playsound mcc:countdown_high @a 0 6 32 1' ], overworld )
			}, 80 )
			system.runTimeout( () => { 
				runCommands( [ 'title @a title Go!', 'execute @a ~~~ playsound mcc:countdown_release @a 0 6 32 1', 'fill -7 7 34 7 7 34 air' ], overworld )
				world.playMusic( 'mcc:parkour_warrior', { fade: 1, loop: true, volume: 1 } )
				players.forEach( playerData => { 
					let player = overworld.getPlayers( { name: playerData.playerName } )[0]
					const itemArray = [ 'redstone', 'gunpowder', 'netherite_ingot1', 'netherite_ingot2', 'netherite_ingot3', 'glass' ]
					itemArray.forEach( ( element ) => overworld.runCommandAsync( `replaceitem entity @a slot.hotbar ${ [ 0, 4, 5, 6, 7, 8 ][ itemArray.indexOf( element ) ] } ${ [2, 3, 4].includes( itemArray.indexOf( element ) ) ? 'netherite_ingot' : element } 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` ) )	
					player.runCommandAsync( `replaceitem entity @s slot.hotbar 1 fire_charge 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }` ) 
				}  )
				tick()
			}, 100 )
			break

		case 'minecraft:redstone': 	
			if ( !player.hasTag( 'B1' ) && !player.hasTag( 'M1' ) ) return
			[ 'Easy', 'Medium', 'Hard' ].forEach( element => { player.removeTag( element ) } )


			player.runCommandAsync( 'replaceitem entity @s slot.hotbar 0 gunpowder 1 0 { "minecraft:item_lock": { "mode": "lock_in_slot" } }' )
			player.teleport( islandLocation, { rotation: islandStand.getRotation() } )
			player.setSpawnPoint( { ...islandLocation, dimension: overworld } )

			system.runTimeout( () => { 
				player.playSound( `mcc:scroll`, { location: player.location, volume: 0.3 } )
				 }, 1 )
			break

		case 'minecraft:fire_charge': 
			const stopGame = new ActionFormData()
			.title( 'Stop Game?' )
			.button( 'Yes' )
			.button( 'No' )

			stopGame.show( player ).then( stopGame => {
				if ( stopGame.selection != 0 ) return
				if ( !running ) return

				world.stopMusic()
				forceStop = true
				overtime = true
				timer = 1
			} )
			break
	}
} )


// Game Functions ---------------------------------------------------------------------------------------------------

function displayLeaderboard() {
	if ( forceStop ) {
		forceStop = false
		runCommands( [ 'gamemode a @a', 'tp @a 0 0 0', 'spawnpoint @a 0 0 0', 'fill -7 7 34 7 7 34 barrier' ], overworld )

		players.forEach( player => { player.stone = 0; player.bronze = 0, player.silver = 0; player.gold = 0; player.end = 0; player.score = 0; player.finished = false, player.island = 'I1' })
		timer = setTimer * 1200
		running = false
		overtime = false	
		return
	}

	overworld.getPlayers().forEach( player => player.playSound( 'mcc:end', { location: player.location, volume: 0.3 } ) )
	overworld.getEntities( { type: 'mcc:leaderboard'} ).forEach( leaderboard => leaderboard.nameTag = `--------------------` )
	world.playMusic( 'mcc:aftermath', { fade: 1, loop: false, volume: 1 } )

	system.runTimeout( () => { 
		runCommands( ['spawnpoint @a 0 0 0', 'gamemode a @a', 'tp @a 0 1 -48', 'fill -7 7 34 7 7 34 barrier' ], overworld )

		players.filter( player => player.team != 'none').forEach( player => {
			teams.get( player.team ).score += player.score
			teams.get( player.team ).multiplier += [0, 0.15, 0.35, 0.8][player.end]
		} )
	
		let iterableTeams = [ ...teams.entries() ]
		iterableTeams.forEach( ( [key, team], index ) => {
			let teamPlayers = players.filter( player => player.team == key )
			let totalScore = Math.round( team.score * team.multiplier )
	
			teamPlayers.forEach( player => player.score += Math.round( ( totalScore - team.score ) / teamPlayers.length ) )
			team.score = totalScore
	
			system.runTimeout( () => {
				const leaderboard = overworld.getEntities( { tags: [ `leaderboard-${key}` ] } )[0]
				leaderboard.nameTag = [team].map( team => `${team.unicode} ${team.name}\n--------------------\n${ teamPlayers.sort( ( a, b ) => b.score - a.score ).map( player => `${ player.playerName }: ${ player.score } ${ ['smile', 'Easy', 'Medium', 'Hard' ][player.end] }` ).join( `\n` ) } `)[ 0 ]
				overworld.runCommandAsync( `playsound mcc:score_regular @a ${leaderboard.location.x} ${leaderboard.location.y} ${leaderboard.location.z} 0.3 1 0.3`)
				overworld.spawnParticle( 'minecraft:huge_explosion_emitter', leaderboard.location, new MolangVariableMap() )
		}, index * 20 + 60 )
		} )
	
		system.runTimeout( () => { 
			const leaderboard = overworld.getEntities( { tags: [ 'leaderboard' ] } )[0]
			leaderboard.nameTag = iterableTeams.filter( ( [key, value] ) => players.filter( player => player.team == key ).length != 0 ).sort( ( [ keyA, teamA ], [ keyB, teamB ]  ) => teamB.score - teamA.score ).map( ( [key, team] ) => `${ team.unicode } ${ team.name }\n------ ${team.score} ------` ).join(`\n`)
			overworld.runCommandAsync( `playsound mcc:score_big @a ${leaderboard.location.x } ${leaderboard.location.y} ${leaderboard.location.z} 0.3 1 0.3` )
			overworld.spawnParticle( 'minecraft:huge_explosion_emitter', leaderboard.location, new MolangVariableMap() )
	
			players.forEach( player => { player.stone = 0; player.bronze = 0, player.silver = 0; player.gold = 0; player.end = 0; player.score = 0; player.finished = false, player.island = 'I1' })
			iterableTeams.forEach( ( [ key, team] ) => { team.score = 0; team.multiplier = 1 } )
			timer = setTimer * 1200
			running = false
			overtime = false
		}, 280 )
	 }, 60 )

}

function obstacles( islands ) {
	
    levels.filter( level => level.moving != undefined ).filter( level => islands.includes( [ 'Easy', 'Medium', 'Hard' ].includes( level.island ) ? 'I6' : level.island ) ).forEach( level => { 
        if ( ticks % ( level.moving.cycle != undefined ? level.moving.cycle : level.moving.delay.reduce( ( a, b ) => a + b ) ) == 0 ) level.move() } )

	if ( islands.includes( 'I2' ) ) {
		switch ( true ) {
			case ticks % 66 == 0: pi( true, [
				{ location: { x: -4, y: 10, z: 294 }, delay: 8 },
				{ location: { x: -6, y: 10, z: 296 }, delay: 12 },
				{ location: { x: -6, y: 10, z: 301 }, delay: 6 },
				{ location: { x: -4, y: 10, z: 302 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 302 }, delay: 6 },
				{ location: { x: 2, y: 10, z: 301 }, delay: 8 },
				{ location: { x: 2, y: 10, z: 296 }, delay: 8 },
				{ location: { x: 1, y: 10, z: 294 }, delay: 8 }
			] ); break
			case (ticks - 46) % 66 == 0 : removePi( true, [
				{ location: { x: -4, y: 10, z: 294 }, delay: 8 },
				{ location: { x: -6, y: 10, z: 296 }, delay: 12 },
				{ location: { x: -6, y: 10, z: 301 }, delay: 6 },
				{ location: { x: -4, y: 10, z: 302 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 302 }, delay: 6 },
				{ location: { x: 2, y: 10, z: 301 }, delay: 8 },
				{ location: { x: 2, y: 10, z: 296 }, delay: 8 },
				{ location: { x: 1, y: 10, z: 294 }, delay: 8 }
			], [ 'yellow', 'gray' ] )
		}
		switch ( true ) {
			case (ticks - 50) % 66 == 0: pi( false, [
				{ location: { x: -5, y: 10, z: 309 }, delay: 8 },
				{ location: { x: -7, y: 10, z: 311 }, delay: 8 },
				{ location: { x: -7, y: 10, z: 316 }, delay: 8 },
				{ location: { x: -5, y: 10, z: 317 }, delay: 8 },
				{ location: { x: 0, y: 10, z: 317 }, delay: 6 },
				{ location: { x: 1, y: 10, z: 316 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 311 }, delay: 6 },
				{ location: { x: 0, y: 10, z: 309 }, delay: 12 },
			] ); break
			case (ticks - 30) % 66 == 0: removePi( false, [
				{ location: { x: -5, y: 10, z: 309 }, delay: 8 },
				{ location: { x: -7, y: 10, z: 311 }, delay: 8 },
				{ location: { x: -7, y: 10, z: 316 }, delay: 8 },
				{ location: { x: -5, y: 10, z: 317 }, delay: 8 },
				{ location: { x: 0, y: 10, z: 317 }, delay: 6 },
				{ location: { x: 1, y: 10, z: 316 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 311 }, delay: 6 },
				{ location: { x: 0, y: 10, z: 309 }, delay: 12 },
			], [ 'yellow', 'gray' ] ); break
		}
		switch (true) {
			case (ticks - 26) % 66 == 0: pi( true, [
				{ location: { x: -4, y: 10, z: 324 }, delay: 8 },
				{ location: { x: -6, y: 10, z: 326 }, delay: 12 },
				{ location: { x: -6, y: 10, z: 331 }, delay: 6 },
				{ location: { x: -4, y: 10, z: 332 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 332 }, delay: 6 },
				{ location: { x: 2, y: 10, z: 331 }, delay: 8 },
				{ location: { x: 2, y: 10, z: 326 }, delay: 8 },
				{ location: { x: 1, y: 10, z: 324 }, delay: 8 }
			] ); break
			case (ticks - 6) % 66 == 0: removePi( true, [
				{ location: { x: -4, y: 10, z: 324 }, delay: 8 },
				{ location: { x: -6, y: 10, z: 326 }, delay: 12 },
				{ location: { x: -6, y: 10, z: 331 }, delay: 6 },
				{ location: { x: -4, y: 10, z: 332 }, delay: 10 },
				{ location: { x: 1, y: 10, z: 332 }, delay: 6 },
				{ location: { x: 2, y: 10, z: 331 }, delay: 8 },
				{ location: { x: 2, y: 10, z: 326 }, delay: 8 },
				{ location: { x: 1, y: 10, z: 324 }, delay: 8 }
			], [ 'yellow', 'gray' ] ); break
		}
	}
}

// Obstacle Functions 

function pi( counterclockwise, locations ) {
    let time = 0
    for ( let i = ( counterclockwise ? 7 : 0 ); counterclockwise ? i >= 0 : i < 8; counterclockwise ? i-- : i++ ) {
        system.runTimeout( () => {
            world.getDimension( 'overworld' ).runCommandAsync( `clone -1000 ${i} -1000 -993 ${i} -993 ${locations[ i ].location.x} ${locations[ i ].location.y} ${locations[ i ].location.z} masked` )
        }, time )
        time += parseInt( locations[ i ].delay ?? 0 )
    }
}

function removePi( counterclockwise, locations, color ) {
    let time = 0
    for ( let i = ( counterclockwise ? 7 : 0 ); counterclockwise ? i >= 0 : i < 8; counterclockwise ? i-- : i++ ) {
        system.runTimeout( () => {
            world.getDimension( 'overworld' ).runCommandAsync( `fill ${locations[ i ].location.x} ${locations[ i ].location.y} ${locations[ i ].location.z} ${locations[ i ].location.x + 5} ${locations[ i ].location.y} ${locations[ i ].location.z +5} air replace ${ i % 2 == 0 ? color[0] : color[1] }_wool ` )
            world.getDimension( 'overworld' ).runCommandAsync( `fill ${locations[ i ].location.x} ${locations[ i ].location.y} ${locations[ i ].location.z} ${locations[ i ].location.x + 5} ${locations[ i ].location.y} ${locations[ i ].location.z +5} air replace concrete["color": "${ i % 2 == 0 ? color[0] : color[1] }"] ` )
        }, time )
        time += parseInt( locations[ i ].delay ?? 0 )
    }
}


// Misc Functions ---------------------------------------------------------------------------------------------------

function runCommands( commands, source ) {
	commands.forEach( command => source.runCommandAsync( command ) )
}


