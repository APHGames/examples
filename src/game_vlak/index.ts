import * as ECS from 'colfio';
import { SCENE_WIDTH, SCENE_HEIGHT, SCENE_RESOLUTION, Assets } from './constants';
import { GameLoader } from './loaders/game-loader';
import { ECSExample } from '../utils/APHExample';
import { getLoadedTexture } from '../utils/assets';

/**
 * Wrapper for markdown gallery
 */
export class Vlak extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: SCENE_WIDTH * SCENE_RESOLUTION,
			height: SCENE_HEIGHT * SCENE_RESOLUTION,
			resolution: SCENE_RESOLUTION
		});
	}

	async load() {
		await new GameLoader().loadGame(this.engine);
	}

	async initResizable(canvas: string | HTMLCanvasElement) {
		await super.init(canvas);
		this.initResizeHandler();
	}

	onDestroy() {
		getLoadedTexture(Assets.SPRITESHEET).source.scaleMode = 'linear';
	}

	private initResizeHandler() {
		this.resizeHandler();
		window.addEventListener('resize', this.resizeHandler);
	}

	private resizeHandler = () => {
		// the window can resize only if we can scale the original resolution by an integer. Otherwise it would blur the pixel art
		const acceptableScale = Math.min(Math.floor(window.innerWidth / SCENE_WIDTH), Math.floor(window.innerHeight / SCENE_HEIGHT));
		if (acceptableScale > 0) {
			this.engine.app.renderer.resolution = acceptableScale;
			this.engine.app.canvas.width = SCENE_WIDTH * acceptableScale;
			this.engine.app.canvas.height = SCENE_HEIGHT * acceptableScale;
		}
	}
}
