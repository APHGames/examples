import * as PIXI from 'pixi.js';
import PIXISound from 'pixi-sound';
import * as ECS from '../../libs/pixi-ecs';
import { Assets } from './constants';
import { Factory } from './factory';
import { ECSExample, getBaseUrl } from '../utils/APHExample';

/**
 * Wrapper for markdown gallery
 */
export class Tetris extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: 640 * 2,
			height: 400 * 2,
			resolution: 2
		});
	}

	load() {

		PIXI.settings.ROUND_PIXELS = true;
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
		this.initResizeHandler();
		this.displayLoadingText();

		this.engine.app.loader
			.reset()
			.add(Assets.FONT_DOS, `${getBaseUrl()}/assets/game_tetris/dos.fnt`)
			.add(Assets.FONT_DOS_TEXTURE, `${getBaseUrl()}/assets/game_tetris/dos.png`)
			.add(Assets.SOUND_GAMEOVER, `${getBaseUrl()}/assets/game_tetris/snd_gameover.mp3`)
			.add(Assets.SOUND_LEVELUP, `${getBaseUrl()}/assets/game_tetris/snd_levelup.mp3`)
			.add(Assets.SOUND_MOVEDOWN, `${getBaseUrl()}/assets/game_tetris/snd_movedown.mp3`)
			.add(Assets.SOUND_PLACE, `${getBaseUrl()}/assets/game_tetris/snd_place.mp3`)
			.add(Assets.SOUND_ROTATE, `${getBaseUrl()}/assets/game_tetris/snd_rotate.mp3`)
			.add(Assets.SOUND_ROWCLEAR, `${getBaseUrl()}/assets/game_tetris/snd_rowclear.mp3`)
			.add(Assets.MUSIC, `${getBaseUrl()}/assets/game_tetris/music.mp3`)
			.load(() => this.loadGame());

		// todo refactor this
		PIXISound.add(Assets.SOUND_GAMEOVER, `${getBaseUrl()}/assets/game_tetris/snd_gameover.mp3`);
		PIXISound.add(Assets.SOUND_LEVELUP, `${getBaseUrl()}/assets/game_tetris/snd_levelup.mp3`);
		PIXISound.add(Assets.SOUND_MOVEDOWN, `${getBaseUrl()}/assets/game_tetris/snd_movedown.mp3`);
		PIXISound.add(Assets.SOUND_PLACE, `${getBaseUrl()}/assets/game_tetris/snd_place.mp3`);
		PIXISound.add(Assets.SOUND_ROTATE, `${getBaseUrl()}/assets/game_tetris/snd_rotate.mp3`);
		PIXISound.add(Assets.SOUND_ROWCLEAR, `${getBaseUrl()}/assets/game_tetris/snd_rowclear.mp3`);
		PIXISound.add(Assets.MUSIC, `${getBaseUrl()}/assets/game_tetris/music.mp3`);

	}

	/**
	 * Displays a loading text
	 * No need to remove it, because the whole scene is going to be cleared out
	 * after the assets has been loaded
	 */
	displayLoadingText() {
		const loadingText = new ECS.Text('');
		loadingText.style = new PIXI.TextStyle({
			fill: '0xFFFFFF',
			fontWeight: 'bold',
			fontSize: '30pt',
			align: 'center'
		});
		loadingText.anchor.set(0.5);
		loadingText.position.set(this.engine.scene.width / 2, this.engine.scene.height / 2);
		this.engine.scene.stage.addChild(loadingText);

		// will display animated dots
		let loadingDots = 0;
		this.engine.scene.addGlobalComponent(
			new ECS.FuncComponent('').setFixedFrequency(5).doOnFixedUpdate(() => {
				const dotsText = new Array(loadingDots * 2).fill('.').join('');
				loadingText.text = dotsText;
				loadingDots = (loadingDots + 1) % 20;
			}));
	}

	loadGame() {
		const factory = new Factory();
		factory.loadIntro(this.engine.scene);
	}

	initResizable(canvas: string | HTMLCanvasElement) {
		super.init(canvas);
		this.initResizeHandler();
	}

	onDestroy() {
		PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR;
		PIXI.settings.ROUND_PIXELS = false;
	}

	private initResizeHandler() {
		this.resizeHandler();
		window.addEventListener('resize', this.resizeHandler);
	}

	private resizeHandler = () => {
		const acceptableScale = Math.min(
			Math.floor(window.innerWidth / 640), Math.floor(window.innerHeight / 400));
		if (acceptableScale > 0) {
			this.engine.app.renderer.resolution = acceptableScale;
			this.engine.app.view.width = 640 * acceptableScale;
			this.engine.app.view.height = 400 * acceptableScale;
		}
	}
}