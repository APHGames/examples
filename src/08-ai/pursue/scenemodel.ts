import { BotModel } from './botmodel';
import { GridMap } from '../../../libs/aph-math/pathfinding/gridmap';
import * as ECS from '../../../libs/pixi-ecs';
import { MAP_CELL_SIZE } from './constants';

export class SceneModel {
	bots: BotModel[] = [];
	map: GridMap;

	constructor(map: GridMap) {
		this.map = map;
	}

	/**
 * Transforms map coordinates into world coordinates
 */
	mapToWorld(x: number, y: number) {
		return new ECS.Vector(x * MAP_CELL_SIZE, y * MAP_CELL_SIZE);
	}

	/**
	 * Transforms world coordinates into map coordinates
	 */
	worldToMap(x: number, y: number) {
		return new ECS.Vector(Math.floor(x / MAP_CELL_SIZE), Math.floor(y / MAP_CELL_SIZE));
	}
}