import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { SCENE_WIDTH, Assets } from './constants';
import { Factory } from './factory';
import { LevelBuilder, LEVEL_DEFAULT, LEVEL_DEFAULT_WIDTH } from './level';
import { loadAssets, getLoadedTexture } from '../../utils/assets';

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
			// Scale the 800×600 view to fill the browser window (letterboxed)
			resizeToScreen: true,
		});
	}

	async load() {
		await loadAssets([
			{ alias: Assets.SPRITESHEET, src: `${getBaseUrl()}/assets/06-physics/platformer/spritesheet.png` },
			{ alias: Assets.LEVEL_BACKGROUND, src: `${getBaseUrl()}/assets/06-physics/platformer/level_background.jpg` },
		]);
		getLoadedTexture(Assets.SPRITESHEET).source.scaleMode = 'nearest';
		getLoadedTexture(Assets.LEVEL_BACKGROUND).source.scaleMode = 'nearest';
		this.loadScene();
	}

	loadScene() {
		const scene = this.engine.scene;
		const defaultLevel = new LevelBuilder().buildLevel('default', LEVEL_DEFAULT, LEVEL_DEFAULT_WIDTH);
		const factory = new Factory();
		factory.loadLevel(defaultLevel, scene);
	}

	onDestroy() {
		getLoadedTexture(Assets.SPRITESHEET).source.scaleMode = 'linear';
		getLoadedTexture(Assets.LEVEL_BACKGROUND).source.scaleMode = 'linear';
	}
}
