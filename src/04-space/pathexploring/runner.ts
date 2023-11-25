import { StateMachine, State } from './structs/state-machine';
import { MapGrid } from './structs/map-grid';
import { Coord } from './structs/coord';
import { MapGenerator, MapGeneratorEvent } from './algorithms/map-generator';
import { MapExplorer, ExploreEvent } from './algorithms/map-explorer';
import { RenderData, GFXRenderer } from './gfx-renderer';

import * as ECS from '../../../libs/pixi-ecs';

/**
 * Names for all states
 * GENERATE = generating map
 * EXPLORE = exploring map
 * SEARCH_BACK = searching the path to the first city
 * WALK_BACK = walking back to the first city
 * TSP_PREPARE = preparing spanning tree
 * TSP_SOLVE = solving TSP
 * TSP_WALK = walking between cities
 */
export type StateName = 'GENERATE' | 'EXPLORE';


/**
 * Input parameters for the runner
 */
export type RunnerParams = {
	mapWidth: number;
	mapHeight: number;
	randomSeed: number;
	startCityIndex: number;
	visualSpeed: number;
	citiesNum: number;
	wallsNum: number;
}

/**
 * A global mutable context for all states
 */
export type RunnerContext = RunnerParams & Partial<{
	map: MapGrid;
	startCityCoord: Coord;

	generator: MapGenerator;
	generatorGenerator: Generator<MapGeneratorEvent, MapGeneratorEvent, void>;

	explorer: MapExplorer;
	exploreGenerator: Generator<ExploreEvent, ExploreEvent, void>;

	allCities: Coord[];
}>

// ============================================================================================
//                             IMPLEMENTATION OF ALL STATES
// ============================================================================================

// typecheck helper
export type ContextState = {
	name: StateName;
};

const GenerateState: State<RunnerContext, RenderData> & ContextState = {
	name: 'GENERATE',
	firstRun: (context) => {
		context.generator = new MapGenerator(context.randomSeed);
		context.generatorGenerator = context.generator.generateMapIteratively(
			context.mapWidth,
			context.mapHeight,
			context.citiesNum,
			context.wallsNum
		);
	},
	handlerFunc: (context): RenderData => {
		const status = context.generatorGenerator.next();
		if (!status.done && status.value) {
			// report to the looper
			return {
				map: context.generator.generatedMap,
				contextNodes: [status.value.currentTile.coord],
			};
		} else {
			// finish -> update context
			context.map = context.generator.generatedMap;
			context.allCities = context.map.mapArray.filter(a => a.type === 'CITY').map(a => a.coord);
			// generator could have decreased the total number of cities
			// we need to fix a few attributes
			context.startCityIndex = Math.min(context.startCityIndex, context.allCities.length - 1);
			context.startCityCoord = context.allCities[context.startCityIndex];
			// set the right city number
			context.citiesNum = context.allCities.length;
			return null;
		}
	}
};

const ExploreState: State<RunnerContext, RenderData> & ContextState = {
	name: 'EXPLORE',
	firstRun: (context) => {
		context.explorer = new MapExplorer();
		context.exploreGenerator = context.explorer.exploreMapIteratively(context.startCityCoord, context.map);
	},
	handlerFunc: (context): RenderData => {
		const status = context.exploreGenerator.next();
		if (!status.done && status.value) {
			// report to the looper
			return {
				map: context.explorer.blindMap,
				currentNode: context.explorer.current,
				backtrace: context.explorer.backTrace,
				milestones: context.explorer.checkpointStack.getNodes()
			};
		} else {
			return null;
		}
	},
};

export class Runner extends ECS.Component {
	stateMachine = new StateMachine<RunnerContext, RenderData>();
	context: RunnerContext;
	renderer: GFXRenderer;

	constructor(renderer: GFXRenderer) {
		super();
		this.renderer = renderer;
	}

	onInit() {
		const params: RunnerParams = {
			mapWidth: 50,
			mapHeight: 50,
			randomSeed: 56,
			startCityIndex: 2,
			visualSpeed: 100,
			citiesNum: 10,
			wallsNum: 800,
		};

		const blockSize = Math.min(Math.floor(this.scene.width / params.mapWidth), Math.floor(this.scene.height / params.mapHeight));
		const objWidth = blockSize * params.mapWidth;
		const objHeight = blockSize * params.mapHeight;

		this.owner.position.set(this.scene.width / 2 - objWidth / 2, this.scene.height / 2 - objHeight / 2);

		this.context = {
			...params
		};

		// initialize state machine with all transitions
		this.stateMachine
			.addState(GenerateState)
			.addState(ExploreState)
			.addTransition(GenerateState.name, ExploreState.name)
			.setInitialState(GenerateState.name)
			.setContext(this.context);
	}

	onUpdate() {
		const data = this.stateMachine.run();
		this.renderer.renderData(data);
	}
}