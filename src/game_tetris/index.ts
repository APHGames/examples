import * as PIXI from 'pixi.js';
import { sound as PIXISound } from '@pixi/sound';
import * as ECS from 'colfio';
import { Assets } from './constants';
import { Factory } from './factory';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import { loadAssets, loadTextAsset, getLoadedTexture } from '../utils/assets';

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

	async load() {
		this.initResizeHandler();
		this.displayLoadingText();

		await loadAssets([
			{ alias: Assets.FONT_DOS_TEXTURE, src: `${getBaseUrl()}/assets/game_tetris/dos.png` },
		]);
		await loadTextAsset(Assets.FONT_DOS, `${getBaseUrl()}/assets/game_tetris/dos.fnt`);
		getLoadedTexture(Assets.FONT_DOS_TEXTURE).source.scaleMode = 'nearest';

		// todo refactor this
		PIXISound.add(Assets.SOUND_GAMEOVER, `${getBaseUrl()}/assets/game_tetris/snd_gameover.mp3`);
		PIXISound.add(Assets.SOUND_LEVELUP, `${getBaseUrl()}/assets/game_tetris/snd_levelup.mp3`);
		PIXISound.add(Assets.SOUND_MOVEDOWN, `${getBaseUrl()}/assets/game_tetris/snd_movedown.mp3`);
		PIXISound.add(Assets.SOUND_PLACE, `${getBaseUrl()}/assets/game_tetris/snd_place.mp3`);
		PIXISound.add(Assets.SOUND_ROTATE, `${getBaseUrl()}/assets/game_tetris/snd_rotate.mp3`);
		PIXISound.add(Assets.SOUND_ROWCLEAR, `${getBaseUrl()}/assets/game_tetris/snd_rowclear.mp3`);
		PIXISound.add(Assets.MUSIC, `${getBaseUrl()}/assets/game_tetris/music.mp3`);

		this.loadGame();
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
			fontSize: 30,
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

	async initResizable(canvas: string | HTMLCanvasElement) {
		await super.init(canvas);
		this.initResizeHandler();
	}

	onDestroy() {
		getLoadedTexture(Assets.FONT_DOS_TEXTURE).source.scaleMode = 'linear';
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
			this.engine.app.canvas.width = 640 * acceptableScale;
			this.engine.app.canvas.height = 400 * acceptableScale;
		}
	}
}
