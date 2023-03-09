import * as ECS from '../../../libs/pixi-ecs';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import * as PIXI from 'pixi.js';
import { SCENE_WIDTH, Assets } from './constants';
import { Factory } from './factory';
import { LevelBuilder, LEVEL_DEFAULT, LEVEL_DEFAULT_WIDTH } from './level';

const WIDTH = 800;
const HEIGHT = 600;

export class Platformer extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: WIDTH,
			height: HEIGHT,
			resolution: WIDTH / SCENE_WIDTH,
			backgroundColor: 0x0a0a0a,
			antialias: false,
		});
	}

	load() {
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;

		this.engine.app.loader
			.reset()
			.add(Assets.SPRITESHEET, `${getBaseUrl()}/assets/06-physics/platformer/spritesheet.png`)
			.add(Assets.LEVEL_BACKGROUND, `${getBaseUrl()}/assets/06-physics/platformer/level_background.jpg`)
			.load(() => this.loadScene());
	}

	loadScene() {
		const scene = this.engine.scene;
		const defaultLevel = new LevelBuilder().buildLevel('default', LEVEL_DEFAULT, LEVEL_DEFAULT_WIDTH);
		const factory = new Factory();
		factory.loadLevel(defaultLevel, scene);
	}

	onDestroy() {
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
	}
}
