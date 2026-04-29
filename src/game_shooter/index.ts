import * as ECS from '../../libs/pixi-ecs';
import { ECSExample } from '../utils/APHExample';
import { Factory } from './factory';
import { ARENA_WIDTH, ARENA_HEIGHT } from './constants';

/**
 * Neon Twin-Stick Arcade Shooter
 *
 * Controls:
 *   WASD         — move the ship
 *   Mouse / Arrow keys — aim independently
 *   Space        — shoot
 *   B            — bomb (clears all enemies)
 */
export class ShooterGame extends ECSExample {
	private seed?: number;

	constructor(config: ECS.EngineConfig = {}, seed?: number) {
		super({
			...config,
			width: ARENA_WIDTH,
			height: ARENA_HEIGHT,
			backgroundColor: 0x050a12,
			antialias: true,
		});
		this.seed = seed;
	}

	load(): void {
		const factory = new Factory();
		factory.loadGame(this.engine.scene, this.seed);
	}
}
