import { sound as PIXISound } from '@pixi/sound';
import * as ECS from 'colfio';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { loadAssets, loadTextAsset } from '../../utils/assets';
import { Assets } from './constants';
import PacmanFactory from './pacman-factory';
import PacmanModel from './pacman-model';

export class Pacman extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: config.width ?? 800,
			height: config.height ?? 600,
			resolution: 1,
			antialias: true,
			namesSearchEnabled: true,
			tagsSearchEnabled: true,
		});
	}

	async load() {
		const asset = (file: string) => `${getBaseUrl()}/assets/games/pacman/${file}`;

		await loadAssets([
			{ alias: Assets.SPRITESHEET, src: asset('sprites.png') },
			{ alias: Assets.BACKGROUND, src: asset('map.png') },
		]);
		const spritesData = JSON.parse(await loadTextAsset(Assets.SPRITES, asset('sprites.json')));
		const mapData = await loadTextAsset(Assets.MAP, asset('map.txt'));

		try {
			PIXISound.add(Assets.SND_DEATH, asset('death.mp3'));
			PIXISound.add(Assets.SND_PACDOT, asset('pacdot.mp3'));
			PIXISound.add(Assets.SND_PELLET, asset('pellet.mp3'));
			PIXISound.add(Assets.SND_RUSHKILL, asset('rushkill.mp3'));
		} catch {
			/* audio optional */
		}

		const factory = new PacmanFactory(spritesData);
		const model = new PacmanModel();
		model.loadMap(mapData);
		factory.initializeLevel(this.engine.scene, model);
	}
}
