import * as PIXI from 'pixi.js';
import PIXISound from 'pixi-sound';
import * as ECS from '../../libs/pixi-ecs';
import { SCENE_WIDTH, SCENE_HEIGHT, SCENE_RESOLUTION } from './constants';
import { GameLoader } from './loaders/game-loader';
import { ECSExample } from '../utils/APHExample';

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

	load() {
		// pixel-art: no interpolation, round pixels
		PIXI.settings.ROUND_PIXELS = true;
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		new GameLoader().loadGame(this.engine);
	}

	initResizable(canvas: string | HTMLCanvasElement) {
		super.init(canvas);
		this.initResizeHandler();
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
			this.engine.app.view.width = SCENE_WIDTH * acceptableScale;
			this.engine.app.view.height = SCENE_HEIGHT * acceptableScale;
		}
	}
}