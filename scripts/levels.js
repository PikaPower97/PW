import {difficulty, preset, overworld} from './index.js'
import { system } from '@minecraft/server'

export class Level {
    constructor( level ) {
        if ( level.title != undefined ) this.title = level.title
        if ( level.island != undefined ) this.island = level.island
        if ( level.bonus != undefined ) this.bonus = level.bonus
        if ( level.structures != undefined ) this.structures = level.structures
        if ( level.moving != undefined ) this.moving = level.moving
        if ( level.dx != undefined ) this.dx = level.dx
        
        this.id = level.id
        this.x = level.x
        this.y = level.y
        this.z = level.z
    }
    move(){
        if (this.moving == undefined) return
        
        [ this.simpleSwap, this.snek, this.bridge ][ [ 'simpleSwap', 'snek', 'bridge' ].indexOf( this.moving.id ) ].bind( this )()
    }
    simpleSwap(){
        let time = 0
        this.structures.forEach( ( str, index ) => { 
            system.runTimeout( () => {
                overworld.runCommandAsync( `structure load ${str} ${this.x} ${this.y + this.moving.dy} ${this.z}` ) }, time )
            time += this.moving.delay[ index ]
        } )
    }
    snek(){
        const moving = this.moving
        const bonusIsland = [ 'I1', 'I2', 'I3', 'I4', 'I5' ].includes(this.island)
        const bonusLevel = [ 'B1', 'B2', 'B3' ].includes( this.bonus )
        
        moving.sneks.forEach( (snek, index) => { system.runTimeout( () => {
            let time = 0
            let count = 0
            const { dx, dy, dz } = (bonusIsland && bonusLevel) ? snek.delta : { dx: snek.delta.dz + 1, dy: snek.delta.dy, dz: this.dx - snek.delta.dx - 1 }
            const start = { x: this.x + dx, y: this.y + dy, z: this.z + dz }
        
            snek.direction.forEach( direction => {
                Object.assign( direction, { ...start, count: count } )

                const { fx, fy, fz, dx, dy, dz, x, y, z } = (bonusIsland && bonusLevel) 
                    ? { ...direction, fx: (direction.fx ?? 0) * (snek.length - 1), fy: (direction.fy ?? 0) * (snek.length - 1), fz:  (direction.fz ?? 0) * (snek.length - 1), dx: (direction.dx ?? 0), dy: (direction.dy ?? 0), dz:  (direction.dz ?? 0) } 
                    : { ...direction, fx: (direction.fz ?? 0) * (snek.length - 1), fy: (direction.fy ?? 0) * (snek.length - 1), fz: -(direction.fx ?? 0) * (snek.length - 1), dx: (direction.dz ?? 0), dy: (direction.dy ?? 0), dz: -(direction.dx ?? 0) }

                start.x += dx + fx 
                start.y += dy + fy 
                start.z += dz + fz 
                
                system.runTimeout( () => { overworld.runCommandAsync( `fill ${x} ${y} ${z} ${x + fx} ${y + fy} ${z + fz} ${moving.blocks[ direction.count % moving.blocks.length ] }` ) }, time )
                system.runTimeout( () => { overworld.runCommandAsync( `fill ${x} ${y} ${z} ${x + fx} ${y + fy} ${z + fz} mcc:empty` ) }, (time + moving.decay) )

                time += moving.delay[ direction.count % moving.delay.length ]
                count++
            } )
        }, snek.delay != undefined ? snek.delay : 0 ) } ) 
    }
    bridge() {
        const moving = this.moving
        const bonusIsland = [ 'I1', 'I2', 'I3', 'I4', 'I5' ].includes(this.island)
        const bonusLevel = [ 'B1', 'B2', 'B3' ].includes( this.bonus )

        moving.bridges.forEach( (bridge, index) => system.runTimeout( () => {
            let time = 0
            let count = 0
            const { dx, dy, dz } = (bonusIsland && bonusLevel) ? bridge.delta : { dx: bridge.delta.dz + 1, dy: bridge.delta.dy, dz: this.dx - bridge.delta.dx }
            const start = { x: this.x + dx, y: this.y + dy, z: this.z + dz }

            for( let i = 0; i < bridge.length; i++ ) {
                const { x, y, z } = start
                const { dx, dy, dz, step } = (bonusIsland && bonusLevel) 
                ? { dx: bridge.direction.dx ?? 0, dy: bridge.direction.dy ?? 0, dz: bridge.direction.dz ?? 0, step: count } 
                : { dx: bridge.direction.dz ?? 0, dy: bridge.direction.dy ?? 0, dz: -(bridge.direction.dx ?? 0), step: count }

                start.x += dx
                start.y += dy
                start.z += dz

                system.runTimeout( () => overworld.runCommandAsync( `structure load ${moving.structures[0]} ${x} ${y} ${z}` ), time )
                system.runTimeout( () => overworld.runCommandAsync( `structure load ${moving.structures[1]} ${x} ${y} ${z}` ), time + bridge.decay )

                time += moving.delay[ step % moving.delay.length ]
                count++
            }
            
        }, ( bridge.delay ?? 0 ) ) )
    }
}

// Level Data

export let levels = []

const bonusList = [
    { difficulty: 0, title: 'The Prism Dash', id: 'PrismDash', variants: [ 
        { variant: 'A', dx: 31, dy: 0 }, 
        { variant: 'B', dx: 31, dy: 0 }, 
        { variant: 'C', dx: 32, dy: 0 }, ] },
    { difficulty: 0, title: 'The Twin Beams', id: 'TwinBeams', structures: ['TB1', 'TB2', 'TB1', 'TB3'], variants: [ 
        { variant: 'A', dx: 33, dy: 0, moving: { id: 'simpleSwap', delay: [14, 22, 8, 22], dy: 34 } }, 
        { variant: 'B', dx: 33, dy: 0, moving: { id: 'simpleSwap', delay: [16, 22, 10, 22], dy: 34 } }, 
        { variant: 'C', dx: 33, dy: 0, moving: { id: 'simpleSwap', delay: [16, 22, 10, 22], dy: 34 } },
        { variant: 'D', dx: 33, dy: 0, moving: { id: 'simpleSwap', delay: [16, 22, 10, 22], dy: 34 } }, ] },
    { difficulty: 0, title: 'The Crossing Chains', id: 'CrossingChains', variants: [ 
        { variant: 'A', dx: 21, dy: -1 }, 
        { variant: 'B', dx: 21, dy: -1 },
        { variant: 'C', dx: 21, dy: -2 }, ] },
    { difficulty: 0, title: 'The Rise and Fall', id: 'RiseFall', variants: [ 
        { variant: 'A', dx: 18, dy: -1 }, 
        { variant: 'B', dx: 18, dy: -1 }, ] },         
    { difficulty: 0, title: 'The Ledge Swap', id: 'LedgeSwap', variants: [ 
        { variant: 'A', dx: 31, dy: 0 }, ] },
    { difficulty: 0, title: 'The Chain Molecules', id: 'ChainMolecules', variants: [ 
        { variant: 'A', dx: 19, dy: 0 }, ] },
// -------------------------------------------------------
    { difficulty: 1, title: 'The Cliff Walk', id: 'CliffWalk', variants: [ 
        { variant: 'A', dx: 21, dy: -1 }, ] },
    { difficulty: 1, title: 'The Jumbled Dice', id: 'JumbledDice', variants: [ 
        { variant: 'A', dx: 32, dy: 3 }, 
        { variant: 'B', dx: 32, dy: 3 }, 
        { variant: 'C', dx: 31, dy: 2 }, ] },
    { difficulty: 1, title: 'The Leaping Swings', id: 'LeapingSwings', variants: [ 
        { variant: 'A', dx: 19, dy: -6 }, ] },
    { difficulty: 1, title: 'The Slaloming Panes', id: 'SlalomingPanes', variants: [ 
        { variant: 'A', dx: 14, dy: 0 }, ] },
// -------------------------------------------------------
    { difficulty: 2, title: 'The Oval Hang', id: 'OvalHang', variants: [ 
        { variant: 'A', dx: 24, dy: 0 }, 
        { variant: 'B', dx: 24, dy: 0 },
        { variant: 'C', dx: 24, dy: 0 }, ] },
    { difficulty: 2, title: 'The Simple Neos', id: 'SimpleNeos', variants: [ 
        { variant: 'A', dx: 37, dy: 0 }, 
        { variant: 'B', dx: 37, dy: 0 }, 
        { variant: 'C', dx: 37, dy: 0 }, ] },
    { difficulty: 2, title: 'The Rising Poles', id: 'RisingPoles', variants: [ 
        { variant: 'A', dx: 16, dy: 4 }, 
        { variant: 'B', dx: 15, dy: 6 }, ] },
    { difficulty: 2, title: 'The Double Weaver', id: 'DoubleWeaver', variants: [ 
        { variant: 'A', dx: 28, dy: -2 }, ] },
    { difficulty: 2, title: 'The Half Cubes', id: 'HalfCubes', variants: [ 
        { variant: 'A', dx: 32, dy: 0 }, ] },
// -------------------------------------------------------
    { difficulty: 3, title: 'The Shifting Plates', id: 'ShiftingPlates', structures: ['SP1', 'SP2', 'SP3', 'SP4'], variants: [ 
        { variant: 'A', dx: 43, dy: -4, moving: { id: 'simpleSwap', delay: [2, 20, 2, 20], dy: 30 } }, 
        { variant: 'B', dx: 43, dy: -4, moving: { id: 'simpleSwap', delay: [2, 20, 2, 20], dy: 30 } }, 
        { variant: 'C', dx: 43, dy: -4, moving: { id: 'simpleSwap', delay: [2, 20, 2, 20], dy: 30 } },
        { variant: 'D', dx: 43, dy: -4, moving: { id: 'simpleSwap', delay: [2, 20, 2, 20], dy: 30 } },
        { variant: 'E', dx: 43, dy: -4, moving: { id: 'simpleSwap', delay: [2, 20, 2, 20], dy: 30 } }, ] },
    { difficulty: 3, title: 'The Descending Chains', id: 'DescendingChains', variants: [ 
        { variant: 'A', dx: 19, dy: -4 }, ] },
    { difficulty: 3, title: 'The Duo Prongs', id: 'DuoProngs', variants: [ 
        { variant: 'A', dx: 26, dy: 0 }, 
        { variant: 'B', dx: 26, dy: 0 }, ] },
    { difficulty: 3, title: 'The Curving Slabs', id: 'CurvingSlabs', variants: [ 
        { variant: 'A', dx: 34, dy: 0 }, ] },
    { difficulty: 3, title: 'The Crossing Loops', id: 'CrossingLoops', variants: [ 
        { variant: 'A', dx: 24, dy: 0 }, ] },
// -------------------------------------------------------
    { difficulty: 4, title: 'The Quint Steps', id: 'QuintSteps', variants: [ 
        { variant: 'A', dx: 21, dy: 1 }, ] },
    { difficulty: 4, title: 'The Chain Maze', id: 'ChainMaze', variants: [ 
        { variant: 'A', dx: 19, dy: 4 },
        { variant: 'B', dx: 19, dy: 4 }, ] },
    { difficulty: 4, title: 'The Slippy Chains', id: 'SlippyChains', structures: ['SC1', 'SC2', 'SC3', 'SC4', 'SC1', 'SC5'], variants: [ 
        { variant: 'A', dx: 34, dy: 0, moving: { id: 'simpleSwap', delay: [ 4, 4, 14, 4, 10, 18 ], dy: 33 } }, ] },
    { difficulty: 4, title: 'The Hanging Beams', id: 'HangingBeams', variants: [ 
        { variant: 'A', dx: 25, dy: -4 },
        { variant: 'B', dx: 24, dy: -6 }, ] },
    { difficulty: 4, title: 'The Space Race', id: 'SpaceRace', variants: [ 
        { variant: 'A', dx: 43, dy: 7 }, ] },
    { difficulty: 4, title: 'The Comb Swap', id: 'CombSwap', structures: ['CS1', 'CS2', 'CS1', 'CS3'], variants: [ 
        { variant: 'A', dx: 25, dy: 0, moving: { id: 'simpleSwap', delay: [12, 22, 18, 22], dy: 34 } }, 
        { variant: 'B', dx: 25, dy: 0, moving: { id: 'simpleSwap', delay: [18, 22, 12, 22], dy: 34 } }, 
        { variant: 'C', dx: 25, dy: 0, moving: { id: 'simpleSwap', delay: [12, 22, 18, 22], dy: 34 } }, ] },
// -------------------------------------------------------
    { difficulty: 5, title: 'The Glacier Dash', id: 'GlacierDash', variants: [ 
        { variant: 'A', dx: 30, dy: 0 }, ] },
    { difficulty: 5, title: 'The Edgy Posts', id: 'EdgyPosts', variants: [ 
        { variant: 'A', dx: 34, dy: 0 }, 
        { variant: 'B', dx: 39, dy: 0 }, 
        { variant: 'C', dx: 36, dy: 0 }, ] },
    { difficulty: 5, title: 'The Iron Point', id: 'IronPoint', variants: [ 
        { variant: 'A', dx: 18, dy: -1 }, 
        { variant: 'B', dx: 18, dy: -1 }, ] },
    { difficulty: 5, title: 'The Shrine Rush', id: 'ShrineRush', variants: [ 
        { variant: 'A', dx: 27, dy: 0 }, ] },
    { difficulty: 5, title: 'The Swapping Posts', id: 'SwappingPosts', variants: [ 
        { variant: 'A', dx: 26, dy: 5 }, ] },
    { difficulty: 5, title: 'The Anchor Hop', id: 'AnchorHop', variants: [ 
        { variant: 'A', dx: 23, dy: 0 }, ] },
    // -------------------------------------------------------
    { difficulty: 6, title: 'The Chilly Steps', id: 'ChillySteps', variants: [ 
        { variant: 'A', dx: 21, dy: 4 }, ] },
    { difficulty: 6, title: 'The Magic Crystals', id: 'MagicCrystals', variants: [ 
        { variant: 'A', dx: 18, dy: 0, moving: { id: 'snek', cycle: 120, delay: [28, 32], decay: 90, blocks: ['stained_glass_pane["color": "red"]', 'stained_glass_pane["color": "black"]'], sneks: [
            { delta: { dx: 9, dy: 34, dz: 10 }, length: 1, direction: [ { dx: 1, dz: -1 }, { dx: 1, dz: 1 }, { dx: -1, dz: 1 }, { dx: -1, dz: -1 } ] },
            { delta: { dx: 2, dy: 34, dz: 11 }, length: 1, direction: [ { dx: 1, dz: -1 }, { dx: 1, dz: 1 }, { dx: -1, dz: 1 }, { dx: -1, dz: -1 } ], delay: 30 }
        ] } }, 
        { variant: 'B', dx: 18, dy: 0 }, ] },
    { difficulty: 6, title: 'The Snake Rush', id: 'SnakeRush', variants: [ 
        { variant: 'A', dx: 29, dy: 0, moving: { id: 'snek', cycle: 50, delay: [16, 10, 12, 12], decay: 22, blocks: [ 'stone[ "stone_type": "diorite" ]', 'calcite', 'clay' ], sneks: [
            { delta: { dx: 27, dy: 34, dz: 12 }, length: 3, direction: [
                { fx: -1, dx: -1 }, 
                { fz: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dx: -1 }, 
                { fx: -1, dx: -1 }, 
                { fz:  1, dx: -1 }, 
                { fx: -1, dx: -1 }, 
                { fz: -1, dx: -1 }, 
                { fx: -1, dz: -1 }, 
                { fz: -1, dz: -1 }, 
                { fz: -1, dx: -1 }, 
                { fx: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dz:  1 }, 
                { fz:  1, dx: -1 }, 
                { fx: -1, dx: -1 }
            ] }
        ] } },
        { variant: 'B', dx: 27, dy: 0, moving: { id: 'snek', cycle: 50, delay: [16, 10, 12, 12], decay: 22, blocks: [ 'stone[ "stone_type": "diorite" ]', 'calcite', 'clay' ], sneks: [
            { delta: { dx: 25, dy: 34, dz: 12 }, length: 3, direction: [
                { fx: -1, dx: -1 }, 
                { fz: -1, dz: -1 }, 
                { fz: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dx: -1 }, 
                { fx: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dx: -1 }, 
                { fx: -1, dx: -1 }, 
                { fz: -1, dz: -1 }, 
                { fx: -1, dx: -1 }, 
                { fz: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dz:  1 }, 
                { fx: -1, dx: -1 }
            ] }
        ] } },
        { variant: 'C', dx: 27, dy: 0, moving: { id: 'snek', cycle: 50, delay: [16, 10, 12, 12], decay: 22, blocks: [ 'stone[ "stone_type": "diorite" ]', 'calcite', 'clay' ], sneks: [
            { delta: { dx: 25, dy: 34, dz: 12 }, length: 3, direction: [
                { fx: -1, dx: -1 }, 
                { fz:  1, dz:  1 }, 
                { fx: -1, dx: -1 }, 
                { fx: -1, dz: -1 }, 
                { fz: -1, dz: -1 }, 
                { fz: -1, dx: -1 },
                { fx: -1, dx: -1 }, 
                { fx: -1, dz:  1 }, 
                { fz:  1, dz:  1 }, 
                { fx: -1, dx: -1 }, 
                { fz:  1, dz:  1 }, 
                { fx: -1, dx: -1 }, 
                { fx: -1, dz: -1 }, 
                { fz: -1, dz: -1 }, 
            ] }
        ] } },] },
    { difficulty: 6, title: 'The Chipped Cubes', id: 'ChippedCubes', variants: [ 
        { variant: 'A', dx: 20, dy: 3 }, ] },
// -------------------------------------------------------
    { difficulty: 7, title: 'The Fish Bones', id: 'FishBones', variants: [ 
        { variant: 'A', dx: 23, dy: 0 }, ] },
    { difficulty: 7, title: 'The Ladder Flip', id: 'LadderFlip', variants: [ 
        { variant: 'A', dx: 23, dy: 0 }, ] },
    { difficulty: 7, title: 'The Rythmic Pass', id: 'RythmicPass', structures: ['RP1', 'RP2', 'RP3', 'RP4'], variants: [ 
        { variant: 'A', dx: 24, dy: 1, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 34 } }, 
        { variant: 'B', dx: 22, dy: 1, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 33 } }, 
        { variant: 'C', dx: 24, dy: 1, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 34 } }, ] },
    { difficulty: 7, title: 'The City Center', id: 'CityCenter', variants: [ 
        { variant: 'A', dx: 46, dy: 5 }, ] },
    { difficulty: 7, title: 'The Wooden Twist', id: 'WoodenTwist', variants: [ 
        { variant: 'A', dx: 22, dy:  0 }, 
        { variant: 'B', dx: 23, dy: -1 }, 
        { variant: 'C', dx: 22, dy:  0 },
        { variant: 'D', dx: 22, dy:  0 }, ] },
    { difficulty: 7, title: 'The Checkerboard Swap', id: 'CheckerSwap', structures: ['ChS1', 'ChS2', 'ChS3', 'ChS4'], variants: [ 
        { variant: 'A', dx: 30, dy: 0, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 34 } },
        { variant: 'B', dx: 30, dy: 0, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 34 } },
        { variant: 'C', dx: 30, dy: 0, moving: { id: 'simpleSwap', delay: [2, 16, 2, 16], dy: 34 } }, ] },
// -------------------------------------------------------
    { difficulty: 8, title: 'The Ledge Leap', id: 'LedgeLeap', variants: [ 
        { variant: 'A', dx: 22, dy: 1 }, 
        { variant: 'B', dx: 22, dy: 1 }, 
        { variant: 'C', dx: 22, dy: 1 }, ] },
    { difficulty: 8, title: 'The Narrow Swings', id: 'NarrowSwings', variants: [ 
        { variant: 'A', dx: 21, dy: -5 }, ] },
    { difficulty: 8, title: 'The Crazy Forest', id: 'CrazyForest', variants: [ 
        { variant: 'A', dx: 24, dy: -1 }, 
        { variant: 'B', dx: 24, dy: 1 }, ] },
    { difficulty: 8, title: 'The Chain Pipes', id: 'ChainPipes', variants: [ 
        { variant: 'A', dx: 20, dy: 0 }, ] },
        // -------------------------------------------------------
    { difficulty: 9, title: 'The Winding Panes', id: 'WindingPanes', structures: ['WP1', 'WP2'], variants: [ 
        { variant: 'A', dx: 28, dy: 2, moving: { id: 'simpleSwap', delay: [20, 40], dy: 35 } }, ] },
    { difficulty: 9, title: 'The Concave Twist', id: 'ConcaveTwist', variants: [ 
        { variant: 'A', dx: 26, dy: -2 }, 
        { variant: 'B', dx: 26, dy: -1 }, ] },
    { difficulty: 9, title: 'Take the L', id: 'TakeL', variants: [ 
        { variant: 'A', dx: 29, dy: -2 }, ] },
    { difficulty: 9, title: 'The Railway Flip', id: 'RailwayFlip', variants: [ 
        { variant: 'A', dx: 25, dy: 0 }, ] },
// -------------------------------------------------------
    { difficulty: 10, title: 'The Salmon Ladder', id: 'SalmonLadder', structures: [ 'SL1', 'SL2', 'SL3', 'SL4' ], variants: [ 
        { variant: 'A', dx: 13, dy: 18 },
        { variant: 'B', dx: 13, dy: 18 },
        { variant: 'C', dx: 13, dy: 18, moving: { id: 'simpleSwap', delay: [ 15, 15, 15, 15 ], dy: 33 } },
        { variant: 'D', dx: 13, dy: 15 },
    ] }, 
]

export const mainList = [
    { title: '§7[M1-1] §aThe Slanting Rails' , island: 'I1', bonus: 'M1'},
    { title: '§7[M1-2] §aThe Revealing Flats', island: 'I1', bonus: 'M2', x: -13, y: -26, z: 122, dx: 30, moving: { id: 'bridge', cycle: 100, delay: [0, 2], structures: ['flat', 'air3'], bridges: [
        { length: 9, decay: 40, delta: { dx: 27, dy: 34, dz: 8 }, direction: { dz: 1 } },
        { length: 9, decay: 40, delta: { dx: 14, dy: 34, dz: 8 }, direction: { dz: 1 }, delay: 82 },
        { length: 9, decay: 40, delta: { dx: 7, dy: 34, dz: 16 }, direction: { dz: -1 }, delay: 2 }
    ] } },
    { title: '§7[M1-3] §aThe Duo Blink'      , island: 'I1', bonus: 'M3', x: -13, y: -24, z: 162, dx: 42, structures: [ 'DB1', 'DB2', 'DB1', 'DB3' ], moving: { id: 'simpleSwap', delay: [ 16, 22, 22, 22 ], dy: 34 }},
    { title: '§7[M2-1] §aThe Chain Walls'    , island: 'I2', bonus: 'M1'},
    { title: '§7[M2-2] §aThe Slippy Disks'   , island: 'I2', bonus: 'M2'},
    { title: '§7[M2-3] §aThe Swapping Forks' , island: 'I2', bonus: 'M3'},
    { title: '§7[M3-1] §aThe Leaping Cubes'  , island: 'I3', bonus: 'M1'},
    { title: '§7[M3-2] §aThe Sweet Swings'   , island: 'I3', bonus: 'M2'},
    { title: '§7[M3-3] §aThe Jumping Jellies', island: 'I3', bonus: 'M3'},
    { title: '§7[M4-1] §aThe Broken Windows' , island: 'I4', bonus: 'M1'},
    { title: '§7[M4-2] §aThe Snaking Path'   , island: 'I4', bonus: 'M2', x: -12, y: -32, z: 651, dx: 28, moving: { id: 'snek', cycle: 74, delay: [ 10, 8 ], decay: 26, blocks: [ 'stained_hardened_clay[ "color": "gray"]', 'stained_hardened_clay[ "color": "silver"]' ], sneks: [
        { length: 2, delta: { dx: 26, dy: 33, dz: 11 }, direction: [
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz:  1, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz:  1, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz: -3, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dz: -3, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx:  3, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz: -3, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz:  1, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dz:  1, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dz: -3, dy: -1, dx:  1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 }, 
        { dx: -1, dy: -1, dz: -1, fx: -1, fz: 1, fy: 1 } ]
     }
    ] } },
    { title: '§7[M4-3] §aThe Wall Flip'      , island: 'I4', bonus: 'M3'},
    { title: '§7[M5-1] §aThe Waving Bridge'  , island: 'I5', bonus: 'M1', x: -11, y: -32, z: 766, dx: 41, moving: { id: 'bridge', cycle: 74, delay: [ 8, 6 ], structures: ['bridge', 'air2'], bridges: [
        { length: 44, decay: 48, delta: { dx: -2, dy: 34, dz: 11 }, direction: { dx: 1 } }
    ] } },
    { title: '§7[M5-2] §aThe Checker Barn'   , island: 'I5', bonus: 'M2', x: -11, y: -30, z: 827, dx: 30, structures: [ 'CB1', 'CB2', 'CB1', 'CB3' ], moving: { id: 'simpleSwap', delay: [ 20, 24, 16, 24 ], dy: 34 } },
    { title: '§7[M5-3] §aThe Dueling Bees'   , island: 'I5', bonus: 'M3'}
]

const letters = [ 'A', 'B', 'C', 'D', 'E' ]
const bonusID = [ 'B1', 'B2', 'B3' ]

export const constLevels = []

for ( let i = 0; i < 11; i++ ) {
    constLevels.push( bonusList.filter( level => level.difficulty == i ) )
}

export let levelList = JSON.parse( JSON.stringify( constLevels ) )

// Difficulty Setter + Preset Data

export const presetList = {
    'Random': [
        [ [0, 0, 0], [0, 0, 1], [1, 2, 3] ],
        [ [0, 1, 2], [1, 2, 4], [2, 5, 6] ],
        [ [2, 3, 4], [3, 4, 5], [5, 7, 8] ],
        [ [3, 4, 6], [4, 6, 7], [7, 8, 9] ],
        [ [4, 6, 7], [6, 8, 8], [8, 9, 9] ],
        [ [0, 0, 1], [0, 0, 2] ],
        [ [3, 4, 5], [4, 5, 5] ],
        [ [6, 7, 8], [9, 10, 10] ]
    ],
    'MCC26': [
        [ { id: 'PrismDash'     , variant: 'C' }, { id: 'TwinBeams'    , variant: 'C' }, { id: 'RisingPoles' , variant: 'B' } ],
        [ { id: 'LeapingSwings' , variant: 'A' }, { id: 'SimpleNeos'   , variant: 'C' }, { id: 'EdgyPosts'   , variant: 'C' } ],
        [ { id: 'SlippyChains'  , variant: 'A' }, { id: 'ChillySteps'  , variant: 'A' }, { id: 'WoodenTwist' , variant: 'C' } ],
        [ { id: 'QuintSteps'    , variant: 'A' }, { id: 'MagicCrystals', variant: 'B' }, { id: 'LedgeLeap'   , variant: 'B' } ],
        [ { id: 'RythmicPass'   , variant: 'C' }, { id: 'CrazyForest'  , variant: 'B' }, { id: 'ConcaveTwist', variant: 'B' } ],
        [ { id: 'CrossingChains', variant: 'A' }, { id: 'RiseFall'     , variant: 'B' } ],
        [ { id: 'SwappingPosts' , variant: 'A' }, { id: 'IronPoint'    , variant: 'A' } ],
        [ { id: 'NarrowSwings'  , variant: 'A' }, { id: 'SalmonLadder' , variant: 'D' } ]
    ],
    'MCC28': [
        [ { id: 'PrismDash'     , variant: 'B' }, { id: 'TwinBeams'    , variant: 'B' }, { id: 'RisingPoles' , variant: 'A' } ],
        [ { id: 'JumbledDice'   , variant: 'B' }, { id: 'SimpleNeos'   , variant: 'B' }, { id: 'EdgyPosts'   , variant: 'B' } ],
        [ { id: 'ShiftingPlates', variant: 'B' }, { id: 'ChillySteps'  , variant: 'A' }, { id: 'WoodenTwist' , variant: 'B' } ],
        [ { id: 'QuintSteps'    , variant: 'A' }, { id: 'MagicCrystals', variant: 'A' }, { id: 'LedgeLeap'   , variant: 'B' } ],
        [ { id: 'RythmicPass'   , variant: 'A' }, { id: 'CrazyForest'  , variant: 'B' }, { id: 'ConcaveTwist', variant: 'B' } ],
        [ { id: 'CliffWalk'     , variant: 'A' }, { id: 'RiseFall'     , variant: 'B' } ],
        [ { id: 'ChainMaze'     , variant: 'A' }, { id: 'IronPoint'    , variant: 'B' } ],
        [ { id: 'WindingPanes'  , variant: 'A' }, { id: 'SalmonLadder' , variant: 'D' } ]
    ],
    'MCC30': [
        [ { id: 'PrismDash'     , variant: 'A' }, { id: 'CrossingChains', variant: 'B' }, { id: 'OvalHang'    , variant: 'B' } ],
        [ { id: 'JumbledDice'   , variant: 'C' }, { id: 'SimpleNeos'    , variant: 'A' }, { id: 'EdgyPosts'   , variant: 'B' } ],
        [ { id: 'ShiftingPlates', variant: 'C' }, { id: 'CombSwap'      , variant: 'B' }, { id: 'WoodenTwist' , variant: 'A' } ],
        [ { id: 'DuoProngs'     , variant: 'B' }, { id: 'MagicCrystals' , variant: 'B' }, { id: 'LedgeLeap'   , variant: 'C' } ],
        [ { id: 'RythmicPass'   , variant: 'B' }, { id: 'CrazyForest'   , variant: 'B' }, { id: 'ConcaveTwist', variant: 'B' } ],
        [ { id: 'TwinBeams'     , variant: 'B' }, { id: 'RiseFall'      , variant: 'B' } ],
        [ { id: 'ChainMaze'     , variant: 'A' }, { id: 'IronPoint'     , variant: 'B' } ],
        [ { id: 'CheckerSwap'   , variant: 'B' }, { id: 'SalmonLadder'  , variant: 'A' } ]
    ],
    'MCC31': [
        [ { id: 'PrismDash'     , variant: 'A' }, { id: 'CrossingChains'  , variant: 'A' }, { id: 'OvalHang'    , variant: 'A' } ],
        [ { id: 'JumbledDice'   , variant: 'A' }, { id: 'SimpleNeos'      , variant: 'A' }, { id: 'EdgyPosts'   , variant: 'A' } ],
        [ { id: 'ShiftingPlates', variant: 'A' }, { id: 'DescendingChains', variant: 'A' }, { id: 'WoodenTwist' , variant: 'A' } ],
        [ { id: 'DuoProngs'     , variant: 'A' }, { id: 'MagicCrystals'   , variant: 'A' }, { id: 'LedgeLeap'   , variant: 'A' } ],
        [ { id: 'SnakeRush'     , variant: 'A' }, { id: 'CrazyForest'     , variant: 'A' }, { id: 'ConcaveTwist', variant: 'A' } ],
        [ { id: 'TwinBeams'     , variant: 'A' }, { id: 'RiseFall'        , variant: 'A' } ],
        [ { id: 'CombSwap'      , variant: 'A' }, { id: 'IronPoint'       , variant: 'A' } ],
        [ { id: 'CheckerSwap'   , variant: 'A' }, { id: 'SalmonLadder'    , variant: 'A' } ]
    ],
    'MCC32': [
        [ { id: 'PrismDash'     , variant: 'A' }, { id: 'CrossingChains'  , variant: 'C' }, { id: 'OvalHang'    , variant: 'C' } ],
        [ { id: 'JumbledDice'   , variant: 'A' }, { id: 'SimpleNeos'      , variant: 'C' }, { id: 'ShrineRush'  , variant: 'A' } ],
        [ { id: 'ShiftingPlates', variant: 'D' }, { id: 'SpaceRace'       , variant: 'A' }, { id: 'WoodenTwist' , variant: 'D' } ],
        [ { id: 'DuoProngs'     , variant: 'A' }, { id: 'MagicCrystals'   , variant: 'B' }, { id: 'CityCenter'  , variant: 'A' } ],
        [ { id: 'SnakeRush'     , variant: 'B' }, { id: 'CrazyForest'     , variant: 'B' }, { id: 'ConcaveTwist', variant: 'A' } ],
        [ { id: 'ChainMolecules', variant: 'A' }, { id: 'RiseFall'        , variant: 'B' } ],
        [ { id: 'CombSwap'      , variant: 'C' }, { id: 'IronPoint'       , variant: 'B' } ],
        [ { id: 'CheckerSwap'   , variant: 'C' }, { id: 'SalmonLadder'    , variant: 'B' } ]
    ],
    'MCC34': [
        [ { id: 'TwinBeams'     , variant: 'D' }, { id: 'CrossingChains'  , variant: 'C' }, { id: 'HalfCubes'     , variant: 'A' } ],
        [ { id: 'LeapingSwings' , variant: 'A' }, { id: 'SimpleNeos'      , variant: 'B' }, { id: 'ShiftingPlates', variant: 'E' } ],
        [ { id: 'ShiftingPlates', variant: 'C' }, { id: 'SpaceRace'       , variant: 'A' }, { id: 'WoodenTwist'   , variant: 'C' } ],
        [ { id: 'HangingBeams'  , variant: 'A' }, { id: 'MagicCrystals'   , variant: 'B' }, { id: 'LedgeLeap'     , variant: 'B' } ],
        [ { id: 'SnakeRush'     , variant: 'C' }, { id: 'CrazyForest'     , variant: 'B' }, { id: 'TakeL'         , variant: 'A' } ],
        [ { id: 'LedgeSwap'     , variant: 'A' }, { id: 'RiseFall'        , variant: 'B' } ],
        [ { id: 'CombSwap'      , variant: 'B' }, { id: 'IronPoint'       , variant: 'A' } ],
        [ { id: 'CheckerSwap'   , variant: 'C' }, { id: 'SalmonLadder'    , variant: 'B' } ]
    ],
}

// Course Generation

const islandLocation = [ 
    { x: -24, y: -25, z: 49  }, 
    { x: -24, y: -24, z: 204 },
    { x: -24, y: -24, z: 380 }, 
    { x: -23, y: -30, z: 547 },
    { x: -22, y: -32, z: 718 },
    { x:  23, y: -17, z: 951 },
    { x: -11, y: -22, z: 952 },
    { x: -45, y: -17, z: 951 }
]

function getStructure( island, bonus ) {
    let level = {} 
    let variant = {}

    if ( preset == 'Random' ) {
        level = levelList[ presetList[preset][island - 1][bonus - 1][difficulty] ].splice( Math.floor( Math.random() * levelList[ presetList[preset][island - 1][bonus - 1][difficulty] ].length ), 1 )[0]
        variant = level.variants[ Math.floor( Math.random() * level.variants.length ) ]
        level = { ...level, ...variant, bonus: bonusID[ bonus - 1 ] }
    } else {
        level = bonusList.filter( level => level.id == presetList[preset][island - 1][bonus - 1].id)[0]
        variant = level.variants.filter( level => level.variant == presetList[preset][island - 1][bonus - 1].variant )[0]
        level = { ...level, ...variant, bonus: bonusID[ bonus - 1 ] }
    }

    level.island = [ 'I1', 'I2', 'I3', 'I4', 'I5', 'Easy', 'Medium', 'Hard' ][ island - 1 ] 
    level.title = `§7[${island > 5 ? 'E' : 'B' }${island > 5 ? island - 5 : island }-${bonus}] §${[ 'a', 'a', 'a', 'e', 'e', 'e', 'c', 'c', 'c', 'c', 'c' ][level.difficulty] + level.title}`
    level.id = `${level.id}${island > 5 ? 'End' : ''}${level.variant}`
    if (level.structures != undefined) level.structures = level.structures.map( structure => structure += ( island > 5 ? 'End' : '' ) + level.variant )

    return level
} 

function pathGen( island, {x, y, z} ) {
    let B1 = getStructure( island, 1 )
    let B2 = getStructure( island, 2 )

    island < 6 ? B1 = { ...B1, x: x - B1.dx, y: y, z: z } : B1 = { ...B1, x: x, y: y, z: z }
    island < 6 ? B2 = { ...B2, x: x - B1.dx - B2.dx - 9, y: y + B1.dy , z: z } : B2 = { ...B2, x: x, y: y + B1.dy, z: z + B1.dx + 9 }

    let I1 = { id: `${island > 5 ? 'Island' : 'BonusIsland1'}${island == 6 ? 'Easy' : island == 7 ? 'Medium' : island == 8 ? 'Hard' : letters[island - 1]}`,
    x: island < 6 ? B1.x - 9 : x, y: y + B1.dy, z: island < 6 ? z : z + B1.dx }
    let I2 = { id: `${island > 5 ? 'Ending' : 'BonusIsland2'}${island == 6 ? 'Easy' : island == 7 ? 'Medium' : island == 8 ? 'Hard' : letters[island - 1]}`,
    x: island < 6 ? B2.x - 9 : x, y: I1.y + B2.dy, z: island < 6 ? z : B2.z + B2.dx }

    if (island > 5) return [B1, I1, B2, I2].forEach( level => levels.push( new Level( level ) ) )

    let B3 = getStructure( island, 3 )
    B3 = { ...B3, x: I2.x - B3.dx, y: I2.y, z: z }

    let I3 = { id: 'BonusIslandEnd', x: B3.x - 64, y: I2.y + B3.dy, z: z }

    return [ B1, I1, B2, I2, B3, I3 ].forEach( level => levels.push( new Level( level ) ) )
}

export function courseGen() {
    for ( let i = 1; i < 9; i++ ) pathGen( i, islandLocation[i - 1] ) 

    levelList = JSON.parse( JSON.stringify( constLevels ) )
}
export function resetLevels() {
    levels = []
}
