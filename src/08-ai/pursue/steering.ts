import * as ECS from '../../../libs/pixi-ecs';
import { MAP_TYPE_OCTILE, GridMap, Steering, Path, PathContext } from '../../../libs/aph-math';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import * as PIXI from 'pixi.js';
import { PathFinderContext, AStarSearch } from '../../../libs/aph-math/pathfinding/pathfinding';
import { ATTR_VELOCITY, ATTR_ACCELERATION, ATTR_SCENE_MODEL, MAP_CELL_SIZE } from './constants';
import { SceneModel } from './scenemodel';

export abstract class SteeringComponent extends ECS.Component {
	protected gameSpeed: number;
	protected initialVelocity: ECS.Vector;
	protected sceneModel: SceneModel;

	constructor(gameSpeed: number = 1, initialVelocity: ECS.Vector = new ECS.Vector(0, 0)) {
		super();
		this.gameSpeed = gameSpeed;
		this.initialVelocity = initialVelocity;
	}

	onInit() {
		super.onInit();
		this.owner.assignAttribute(ATTR_VELOCITY, this.initialVelocity);
		this.owner.assignAttribute(ATTR_ACCELERATION, new ECS.Vector(0, 0));
		this.sceneModel = this.scene.getGlobalAttribute<SceneModel>(ATTR_SCENE_MODEL);
	}

	get velocity(): ECS.Vector {
		return this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);
	}

	set velocity(velocity: ECS.Vector) {
		this.owner.assignAttribute(ATTR_VELOCITY, velocity);
	}

	get acceleration(): ECS.Vector {
		return this.owner.getAttribute<ECS.Vector>(ATTR_ACCELERATION);
	}

	set acceleration(acceleration: ECS.Vector) {
		this.owner.assignAttribute(ATTR_ACCELERATION, acceleration);
	}

	onUpdate(delta: number, absolute: number) {
		// update dynamics and set new position
		let force = this.calcForce(delta);
		if (force == null) {
			this.finish();
			return;
		}

		this.acceleration = force;
		// limit acceleration and velocity
		this.acceleration = this.acceleration.limit(30);
		this.velocity = this.velocity.limit(30);

		this.applyVelocity(delta, this.gameSpeed);
		this.applyPosition(delta, this.gameSpeed);

		// change rotation based on the velocity
		let currentAngle = Math.atan2(this.velocity.y, this.velocity.x);
		this.owner.rotation = currentAngle + Math.PI / 2;
	}

	protected applyVelocity(delta: number, gameSpeed: number) {
		this.velocity = this.velocity.add(this.acceleration.multiply(delta * 0.001 * gameSpeed));
	}

	protected applyPosition(delta: number, gameSpeed: number) {
		let deltaPos = this.velocity.multiply(delta * 0.001 * gameSpeed);
		this.owner.position.x += deltaPos.x;
		this.owner.position.y += deltaPos.y;
	}

	protected abstract calcForce(delta: number): ECS.Vector;
}

export class WanderSteering extends SteeringComponent {
	wanderTarget = new ECS.Vector(0, 0);
	angle = 0;
	wanderDistance: number;
	wanderRadius: number;
	wanderJittering: number;

	constructor(wanderDistance: number, wanderRadius: number, wanderJittering: number) {
		super(10, new ECS.Vector(1, 1));
		this.wanderDistance = wanderDistance;
		this.wanderRadius = wanderRadius;
		this.wanderJittering = wanderJittering;
	}

	protected calcForce(delta: number): ECS.Vector {
		let force = Steering.wander(this.velocity, this.wanderTarget, this.wanderRadius, this.wanderDistance, this.wanderJittering, delta);
		this.wanderTarget = force[1];

		let positionRect = this.owner.getBounds();
		let position = this.sceneModel.worldToMap(positionRect.x + positionRect.width / 2, positionRect.y + positionRect.height / 2);
		let velocity = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);
		let direction = velocity.normalize();
		let targetCell = position.add(direction);
		let targetCellDec = new ECS.Vector(Math.round(targetCell.x), Math.round(targetCell.y));
		let isObstacle = this.sceneModel.map.notInside(targetCellDec) || this.sceneModel.map.hasObstruction(targetCellDec);

		// simple collision avoidance by using repulsive forces
		if (isObstacle) {
			// repulsive force
			let isDiagonal = targetCellDec.x !== position.x && targetCellDec.y !== position.y;
			let isHorizontal = targetCellDec.y === position.y;
			let isVertical = targetCellDec.x === position.x;
			let randomShift = Math.random() * velocity.magnitudeSquared();
			if (isDiagonal) {
				this.wanderTarget = new ECS.Vector(-velocity.x * 10 + randomShift, -velocity.y * 10 + randomShift);
			} else if (isHorizontal) {
				this.wanderTarget = new ECS.Vector(-velocity.x * 10 + randomShift, velocity.y * 10 + randomShift);
			} else if (isVertical) {
				this.wanderTarget = new ECS.Vector(velocity.x * 10 + randomShift, -velocity.y * 10 + randomShift);
			}
		}
		return force[0];// no repulsive force
	}
}

export class PursuitSteering extends SteeringComponent {
	target: ECS.Vector;

	constructor(currentVelocity: ECS.Vector, target: ECS.Vector) {
		super(10, currentVelocity);
		this.target = target;
	}


	protected calcForce(delta: number): ECS.Vector {
		let force = Steering.seek(this.target, new ECS.Vector(this.owner.position.x, this.owner.position.y), this.velocity, 20, MAP_CELL_SIZE * 2);
		if (force.magnitudeSquared() < 0.0001) {
			return null;
		}
		return force;
	}
}

export class KeyboardSteering extends SteeringComponent {

	constructor() {
		super(20, new ECS.Vector(10, 0));
	}

	protected calcForce(delta: number): ECS.Vector {
		const key = this.scene.getGlobalAttribute<ECS.KeyInputComponent>('key_input');
		let force = new ECS.Vector(0);

		if (key.isKeyPressed(ECS.Keys.KEY_LEFT)) {
			force = force.add(Steering.seek(new ECS.Vector(-1, 0), new ECS.Vector(0, 0), this.velocity, 200, MAP_CELL_SIZE / 2));
		}
		if (key.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
			force = force.add(Steering.seek(new ECS.Vector(1, 0), new ECS.Vector(0, 0), this.velocity, 200, MAP_CELL_SIZE / 2));
		}
		if (key.isKeyPressed(ECS.Keys.KEY_UP)) {
			force = force.add(Steering.seek(new ECS.Vector(0, -1), new ECS.Vector(0, 0), this.velocity, 200, MAP_CELL_SIZE / 2));
		}
		if (key.isKeyPressed(ECS.Keys.KEY_DOWN)) {
			force = force.add(Steering.seek(new ECS.Vector(0, 1), new ECS.Vector(0, 0), this.velocity, 200, MAP_CELL_SIZE / 2));
		}

		let positionRect = this.owner.getBounds();
		let position = this.sceneModel.worldToMap(positionRect.x + positionRect.width / 2, positionRect.y + positionRect.height / 2);
		let direction = this.velocity.normalize();
		let targetCell = position.add(direction.multiply(0.75)); // half-cell step
		let targetCellDec = new ECS.Vector(Math.round(targetCell.x), Math.round(targetCell.y));
		let isObstacle = this.sceneModel.map.notInside(targetCellDec) || this.sceneModel.map.hasObstruction(targetCellDec);

		// collision avoidance - stop if the force has the same direction as velocity
		if (isObstacle && (force.magnitudeSquared() === 0 || direction.dot(force.normalize()) >= 0)) {
			return new ECS.Vector(-this.velocity.x, -this.velocity.y);
		}
		return force;
	}
}

const DIRECTION_EAST = 1;
const DIRECTION_WEST = 2;
const DIRECTION_NORTH = 3;
const DIRECTION_SOUTH = 4;
export class FollowSteering extends SteeringComponent {

	context: PathContext;
	pointTolerance = 20;
	finalPointTolerance = 3;
	maxVelocity = 15;
	slowingRadius = 10;
	pathFinished = false;
	path: Path = new Path();
	map: GridMap;
	fromPos: ECS.Vector;
	toPos: ECS.Vector;

	constructor(map: GridMap, from: ECS.Vector, to: ECS.Vector) {
		super(15); // 30x speed
		this.context = new PathContext();
		this.map = map;
		this.fromPos = from;
		this.toPos = to;
	}

	onInit() {
		super.onInit();
		this.goToPoint(this.fromPos, this.toPos);
	}

	onUpdate(delta: number, absolute: number) {
		if (!this.pathFinished) {
			super.onUpdate(delta, absolute);
		} else {
			this.acceleration = new ECS.Vector(0, 0);
			this.velocity = new ECS.Vector(0, 0);
			this.finish();
		}
	}

	getDirection(start: ECS.Vector, end: ECS.Vector): number {
		if (start.x + 1 === end.x && start.y === end.y) {
			return DIRECTION_EAST;
		}
		if (start.x === end.x && start.y + 1 === end.y) {
			return DIRECTION_SOUTH;
		}
		if (start.x - 1 === end.x && start.y === end.y) {
			return DIRECTION_WEST;
		}
		if (start.x === end.x && start.y - 1 === end.y) {
			return DIRECTION_NORTH;
		}
	}

	goToPoint(startPos: ECS.Vector, goal: ECS.Vector) {
		let directionPath = new Array<ECS.Vector>();
		let foundpath = new Array<ECS.Vector>();
		// 1) find path from start to goal
		this.findPath(startPos, goal, foundpath, directionPath);

		// 2) transform path from map-coords into world-coords
		let locPath = foundpath.map(mp => this.sceneModel.mapToWorld(mp.x, mp.y).add(new ECS.Vector(MAP_CELL_SIZE / 2, MAP_CELL_SIZE / 2)));
		// 3) add segments into followPath object
		this.path.addFirstSegment(locPath[0], locPath[1]);

		for (let i = 2; i < locPath.length; i++) {
			this.path.addSegment(locPath[i]);
		}

		// 4) start followBehavior
		this.resetPath(this.path);
	}


	protected calcForce(delta: number): ECS.Vector {
		let ownerPos = new ECS.Vector(this.owner.position.x, this.owner.position.y);
		let result = Steering.follow(ownerPos, this.velocity, this.path, this.context, this.pointTolerance,
			this.finalPointTolerance, this.maxVelocity, this.slowingRadius);

		this.pathFinished = result == null;
		return result;
	}

	protected resetPath(path: Path) {
		this.pathFinished = false;
		this.path = path;
		this.context.currentPointIndex = -1;
	}

	protected findPath(start: ECS.Vector, goal: ECS.Vector, outputPath: Array<ECS.Vector>, directionPath: Array<ECS.Vector>) {
		let ctx = new PathFinderContext();
		const astar = new AStarSearch();
		astar.search(this.map, start, goal, ctx);
		let found = ctx.pathFound;

		let previous = new ECS.Vector(-1);
		let current = new ECS.Vector(-1);
		let index = 0;

		// use only direction changes
		for (let path of found) {

			outputPath.push(path);
			index++;

			// add the last one
			if (index === found.length) {
				if (!directionPath[directionPath.length - 1].equals(current)) {
					directionPath.push(current); // add the last one
				}

				directionPath.push(path);
				continue;
			}

			if (previous.x === -1) {
				previous = path;
				directionPath.push(path);
				continue;
			} else if (current.x === -1) {
				current = path;
				directionPath.push(path);
				continue;
			} else if (this.getDirection(previous, current) !== this.getDirection(current, path)) {
				if (!directionPath[directionPath.length - 1].equals(current)) {
					directionPath.push(current); // add the last one
				}
			}

			previous = current;
			current = path;
		}
	}
}
