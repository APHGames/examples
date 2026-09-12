import { sound as PIXISound } from '@pixi/sound';
import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { getLoadedTexture, loadAssets, loadTextAsset } from '../../utils/assets';
import {
	DATA_JSON,
	SCENE_HEIGHT,
	SOUND_GAMEOVER,
	SOUND_HIT,
	SOUND_INTRO,
	SOUND_ROUND,
	SPRITES_RESOLUTION_HEIGHT,
	TEXTURE_ARKANOID,
} from './Constants';
import { Factory } from './Factory';
import { Model } from './Model';

export class Arkanoid extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		const width = config.width ?? 800;
		const height = config.height ?? 600;
		const gameScale = SPRITES_RESOLUTION_HEIGHT / height;
		const resolution = (height / SCENE_HEIGHT) * gameScale;
		const initResolution = resolution / gameScale;

		super({
			...config,
			width,
			height,
			resolution: initResolution,
			antialias: true,
			namesSearchEnabled: true,
			tagsSearchEnabled: true,
		});

		Factory.globalScale = 1 / resolution;
	}

	async load() {
		const asset = (file: string) => `${getBaseUrl()}/assets/games/arkanoid/${file}`;

		await loadAssets([
			{ alias: TEXTURE_ARKANOID, src: asset('sprites.png') },
			{ alias: 'Comfont', src: asset('comfont.TTF') },
		]);
		getLoadedTexture(TEXTURE_ARKANOID).source.scaleMode = 'nearest';

		const dataStr = await loadTextAsset(DATA_JSON, asset('data.json'));

		try {
			PIXISound.add(SOUND_HIT, asset('hit.mp3'));
			PIXISound.add(SOUND_GAMEOVER, asset('gameover.mp3'));
			PIXISound.add(SOUND_INTRO, asset('intro.mp3'));
			PIXISound.add(SOUND_ROUND, asset('round.mp3'));
		} catch {
			/* audio optional */
		}

		const factory = new Factory();
		const model = new Model();
		model.loadModel(JSON.parse(dataStr));
		factory.resetGame(this.engine.scene, model);
	}

	onDestroy() {
		getLoadedTexture(TEXTURE_ARKANOID).source.scaleMode = 'linear';
	}
}
