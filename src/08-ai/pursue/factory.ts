import * as ECS from 'colfio';
import { MAP_TYPE_OCTILE, GridMap } from '../../../libs/aph-math';
import * as PIXI from 'pixi.js';
import { MAP_CELL_SIZE, ATTR_BOTMODEL, ATTR_SCENE_MODEL, MAP } from './constants';
import { SceneModel } from './scenemodel';
import { KeyboardSteering, PursuitSteering } from './steering';
import { BotModel } from './botmodel';
import { BotAnimComponent } from './bot-anim-component';
import { ConeRenderer } from './cone-renderer';
import { BotAIComponent } from './bot-ai-component';
import { BotNoAIComponent } from './bot-noai-component';
import { ParticleRenderer } from './particle-renderer';
import { getLoadedTexture, textureFromFrame } from '../../utils/assets';

export class Factory {

	loadScene(scene: ECS.Scene, map: number[][]) {
		const mapWidth = map[0].length;
		const mapHeight = map.length;

		const grid = new GridMap(MAP_TYPE_OCTILE, 10, mapWidth, mapHeight);

		for (let i = 0; i < mapHeight; i++) {
			for (let j = 0; j < mapWidth; j++) {
				let mapCell = MAP[i][j];
				if (mapCell !== 0) {
					// add obstacles
					grid.addObstruction(new ECS.Vector(j, i));
				}
			}
		}

		const model = new SceneModel(grid);

		// recreate view model
		this.recreateMap(model, scene);
		const keyInput = new ECS.KeyInputComponent();
		scene.addGlobalComponentAndRun(keyInput);
		// todo fix this in ECSLite library
		scene.assignGlobalAttribute('key_input', keyInput);

		scene.assignGlobalAttribute(ATTR_SCENE_MODEL, model);

		this.addBot(scene, model, new ECS.Vector(15, 15), 0x00FF00, true);
		this.addBot(scene, model, new ECS.Vector(10, 10), 0xebe534, false);
	}

	private addBot(scene: ECS.Scene, model: SceneModel, position: ECS.Vector, coneColor: number, isPlayer: boolean) {
		let bot = new ECS.Sprite('', getLoadedTexture('pathfinding'));
		bot.scale.set(MAP_CELL_SIZE / 32);
		let botModel = new BotModel(model.map, bot.id);
		bot.assignAttribute(ATTR_BOTMODEL, botModel);
		model.bots.push(botModel);

		if (isPlayer) {
			bot.addComponent(new KeyboardSteering());
			bot.addComponent(new BotNoAIComponent());
		} else {
			bot.addComponent(new BotAIComponent());
			let renderer = new ECS.Graphics('');
			renderer.addComponent(new ConeRenderer(bot, coneColor));
			scene.stage.addChild(renderer);

			let renderer2 = new ECS.Graphics('');
			renderer2.addComponent(new ParticleRenderer(bot));
			scene.stage.addChild(renderer2);
		}
		bot.anchor.set(0.5);
		bot.addComponent(new BotAnimComponent());
		let mapPos = model.mapToWorld(position.x, position.y);
		bot.position.set(mapPos.x, mapPos.y);
		scene.stage.addChild(bot);
	}

	/**
	 * Recreates view-model
	 */
	private recreateMap(model: SceneModel, scene: ECS.Scene) {
		const texture = getLoadedTexture('pathfinding');
		scene.clearScene();

		// create sprites
		for (let i = 0; i < model.map.width; i++) {
			for (let j = 0; j < model.map.height; j++) {
				const frame = this.getSpriteFrame(model, new ECS.Vector(i, j));
				const textureCl = textureFromFrame(texture, frame.x, frame.y, frame.width, frame.height);
				const sprite = new ECS.Sprite('', textureCl);
				const pos = model.mapToWorld(i, j);
				sprite.position.set(pos.x, pos.y);
				sprite.scale.set(32 / MAP_CELL_SIZE);
				scene.stage.addChild(sprite);
			}
		}
	}


	/**
	 * Sets sprite index according to the type of the block of the map
	 */
	private getSpriteFrame(model: SceneModel, mapPos: ECS.Vector): PIXI.Rectangle {
		let elevation = model.map.getElevation(mapPos);
		let hasObstr = model.map.hasObstruction(mapPos);

		if (hasObstr) {
			return new PIXI.Rectangle(32 * 1, 0, 32, 32);
		}
		if (elevation === 1) {
			return new PIXI.Rectangle(0, 0, 32, 32);
		}
		return new PIXI.Rectangle(0, 0, 32, 32);
	}
}
