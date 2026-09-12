import { sound as PIXISound } from '@pixi/sound';
import * as ECS from 'colfio';
import { Assets as PixiAssets } from 'pixi.js';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { getLoadedAsset, loadAssets, loadTextAsset } from '../../utils/assets';
import { Assets, SCENE_HEIGHT, SPRITES_RESOLUTION_HEIGHT } from './constants';
import ParatrooperFactory from './paratrooper-factory';

export class Paratrooper extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		const width = config.width ?? 800;
		const height = config.height ?? 600;
		const resolution = height / SCENE_HEIGHT;

		super({
			...config,
			width,
			height,
			resolution,
			antialias: true,
			flagsSearchEnabled: true,
			namesSearchEnabled: true,
			tagsSearchEnabled: true,
		});

		ParatrooperFactory.globalScale = SCENE_HEIGHT / SPRITES_RESOLUTION_HEIGHT;
		ParatrooperFactory.screenWidth = SCENE_HEIGHT * (width / height);
	}

	async load() {
		const asset = (file: string) => `${getBaseUrl()}/assets/games/paratrooper/${file}`;

		await loadAssets([
			{ alias: Assets.TEX_CANNON, src: asset('cannon.png') },
			{ alias: Assets.TEX_COPTER_LEFT, src: asset('copter_left.png') },
			{ alias: Assets.TEX_COPTER_RIGHT, src: asset('copter_right.png') },
			{ alias: Assets.TEX_PARATROOPER_PARACHUTE, src: asset('paratrooper_parachute.png') },
			{ alias: Assets.TEX_PARATROOPER, src: asset('paratrooper.png') },
			{ alias: Assets.TEX_PROJECTILE, src: asset('projectile.png') },
			{ alias: Assets.TEX_TOWER, src: asset('tower.png') },
			{ alias: Assets.TEX_TURRET, src: asset('turret.png') },
			{ alias: Assets.TEX_LOGO, src: asset('logo.png') },
		]);
		await PixiAssets.load(asset('font.fnt'));
		await loadTextAsset(Assets.DATA, asset('config.json'));

		try {
			PIXISound.add(Assets.SND_FIRE, asset('fire.mp3'));
			PIXISound.add(Assets.SND_GAMEOVER, asset('gameover.mp3'));
			PIXISound.add(Assets.SND_KILL, asset('kill.mp3'));
		} catch {
			/* audio optional */
		}

		const factory = new ParatrooperFactory();
		factory.resetGame(this.engine.scene, JSON.parse(getLoadedAsset<string>(Assets.DATA)));
	}
}
