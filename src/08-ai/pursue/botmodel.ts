import * as ECS from '../../../libs/pixi-ecs';
import { GridMap } from '../../../libs/aph-math';
import { MAP_CELL_SIZE } from './constants';

export const MAX_PARTICLE_WEIGHT = 10;

export class BotModel {
	// bot identifier
	id: number;
	// current position on the map (not the actual one)
	position: ECS.Vector;
	// normalized direction vector
	direction: ECS.Vector;
	fieldOfView = 60;
	map: GridMap;
	particleMap: GridMap;
	// blocks the bot can see
	visibleBlocks: Set<number> = new Set();

	// bots we are trying to find
	pursuedBot: BotModel;
	// last known position of the bot we are pursuing
	pursuedPosition: ECS.Vector;

	searchingAttempt = 0;

	constructor(map: GridMap, id: number) {
		this.map = map;
		this.particleMap = new GridMap(map.mapType, MAX_PARTICLE_WEIGHT, map.width, map.height);
		this.id = id;
	}

	pursueBot(bot: BotModel) {
		this.pursuedBot = bot;
	}

	isPursuing() {
		return this.pursueBot !== undefined;
	}

	targetBotInSight() {
		const canSeeBot = this.pursuedBot && this.visibleBlocks.has(this.map.indexMapper(this.pursuedBot.position));
		if(canSeeBot) {
			this.pursuedPosition = this.pursuedBot.position;
			this.particleMap.elevations.clear();
			this.searchingAttempt = 0;
		}
		return canSeeBot;
	}

	targetSpotInSight() {
		return this.visibleBlocks.has(this.map.indexMapper(this.pursuedPosition));
	}

	updateAttributes(position: ECS.Vector, direction: ECS.Vector) {
		this.position = position;
		this.direction = direction;
	}

	findNextHotSpot(): ECS.Vector {
		const keys = this.particleMap.elevations.keys();
		let highestElev = 0;
		let highestVector = null;

		for(let key of keys) {
			const vector = this.particleMap.vectorMapper(key);
			const elev = this.particleMap.getElevation(vector);
			if(elev > highestElev) {
				highestElev = elev;
				highestVector = vector;
			}
		}
		return highestVector;
	}

	lookForBotsInSight(others: BotModel[]) {
		for(let bot of others) {
			const mapBlock = this.map.indexMapper(bot.position);
			if(this.visibleBlocks.has(mapBlock)) {
				return bot;
			}
		}
	}

	searchForBot() {
		this.searchingAttempt++;
		this.updateParticleFilter(this.pursuedPosition, MAX_PARTICLE_WEIGHT - Math.max(this.searchingAttempt, 3), Math.max(this.searchingAttempt * 2, 6));
	}

	updateParticleFilter(center: ECS.Vector, maxWeight: number, iterations = 3) {
		// we will use the elevation attribute for particle weight
		this.particleMap.setElevation(center, maxWeight);

		const markNeighbourhood = (pos: ECS.Vector, processedTiles: Set<number>, currentCost: number, minCost: number) => {
			if(currentCost === 0) {
				return;
			}
			const neighbours = this.particleMap.getNeighbors(pos);
			for(let neigh of neighbours) {
				const neighIndex = this.particleMap.indexMapper(neigh);
				// ignoring obstructions from the real map
				if(!this.map.hasObstruction(neigh) && !processedTiles.has(neighIndex)) {
					processedTiles.add(neighIndex);
					this.particleMap.setElevation(neigh, currentCost);
					// minCost indicates the deep of the recursion
					if(currentCost > minCost) {
						markNeighbourhood(neigh, processedTiles, currentCost - 1, minCost);
					}
				}
			}
		};

		// always 3 iterations
		markNeighbourhood(center, new Set(), maxWeight, maxWeight - iterations);
	}

	updateViewCone() {
		this.visibleBlocks.clear();

		let fov = this.fieldOfView / 180 * Math.PI;
		let maxDistance = Math.max(this.map.width, this.map.height);
		// minimum sampling angle is equal to number of cells we can sample from the max distance
		let angleSamples = Math.ceil((maxDistance * 2) / (Math.PI / 2) * fov);
		// not very optimal algorithm - it iterates over every grid you can see within the radius of map size * 2 (diagonal is the maximum)
		for (let i = 0; i < angleSamples; i++) {
			let currAngle = fov / 2 - fov * (i / angleSamples);
			let currDirectionX = Math.cos(currAngle) * this.direction.x - Math.sin(currAngle) * this.direction.y;
			let currDirectionY = Math.sin(currAngle) * this.direction.x + Math.cos(currAngle) * this.direction.y;
			let currDirection = new ECS.Vector(currDirectionX, currDirectionY);
			let currPosition = this.position;
			let counter = 0;
			while (counter++ < (maxDistance * 2)) {
				const currMapPosition = new ECS.Vector(Math.round(currPosition.x), Math.round(currPosition.y));
				let isVisible = !this.map.notInside(currMapPosition) && !this.map.hasObstruction(currMapPosition);
				if (isVisible) {
					const block = this.map.indexMapper(currMapPosition);
					// just for sure, though this if-check is not necessary
					if (!this.visibleBlocks.has(block)) {
						this.visibleBlocks.add(block);
						// update particle filter -> blocks we can see at this moment can be removed
						this.particleMap.setElevation(currMapPosition, 0);
					}
					currPosition = currPosition.add(new ECS.Vector(currDirection.x, currDirection.y));
				}
			}
		}
	}
}