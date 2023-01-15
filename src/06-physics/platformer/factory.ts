import * as ECS from '../../../libs/pixi-ecs';
import { Level } from './level';
import * as PIXI from 'pixi.js';
import { TEXTURE_SCALE, SpritesData, MapTileType, Assets, Attributes, DIR_RIGHT, Tags } from './constants';
import { TextureSwitcher } from './texture-switcher';
import { Camera } from './camera';
import { PlayerController } from './player-controller';


export class Factory {

	loadLevel(level: Level, scene: ECS.Scene) {
		scene.clearScene();
		const keyInput = new ECS.KeyInputComponent();
		scene.addGlobalComponent(keyInput);

		//create map layer
		let mapLayer = new ECS.Container('mapLayer');
		scene.stage.addChild(mapLayer);

		//add background
		this.buildBackground(mapLayer);

		//load tiles
		for (let y = 0; y < level.height; y++) {
			for (let x = 0; x < level.width; x++) {
				const blockType = level.tiles[y][x];

				switch (blockType) {
					case MapTileType.PLAYER:
						this.buildPlayer(x, y, scene, keyInput, level, mapLayer);
						break;
					case MapTileType.WALL:
						this.buildSprite(x, y, blockType, mapLayer);
						break;
					case MapTileType.BOX:
						this.buildCollidable(x, y, blockType, scene, mapLayer);
						break;
				}
			}
		}
	}


	private buildSprite(x: number, y: number, tileType: MapTileType, mapLayer: ECS.Container) {
		const textureInfo = SpritesData[tileType];
		let sprite = new ECS.Sprite('sprite', this.createTexture(textureInfo.x, textureInfo.y, textureInfo.w, textureInfo.h));
		sprite.scale.set(TEXTURE_SCALE);
		sprite.position.x = x;
		sprite.position.y = y;
		mapLayer.addChild(sprite);
	}

	private buildCollidable(x: number, y: number, tileType: MapTileType, scene: ECS.Scene, mapLayer: ECS.Container) {
		let textureInfo = SpritesData[tileType];
		new ECS.Builder(scene)
			.withTag(Tags.COLLIDABLE)
			.anchor(0, 0)
			.localPos(x, y)
			.asSprite(this.createTexture(textureInfo.x, textureInfo.y, textureInfo.w, textureInfo.h))
			.withParent(mapLayer)
			.scale(TEXTURE_SCALE)
			.build();
	}

	private buildPlayer(x: number, y: number, scene: ECS.Scene, keyInput: ECS.KeyInputComponent, level: Level, mapLayer: ECS.Container) {
		let textureInfo = SpritesData[MapTileType.PLAYER];
		new ECS.Builder(scene)
			.anchor(0, 0)
			.localPos(x, y)
			.withName(MapTileType.PLAYER)
			.asSprite(this.createTexture(textureInfo.x, textureInfo.y, textureInfo.w, textureInfo.h))
			.withParent(mapLayer)
			.withComponent(new PlayerController({ keyInput, level }))
			.withComponent(new Camera({ container: mapLayer }))
			.withComponent(new TextureSwitcher())
			.withAttribute(Attributes.DIRECTION, DIR_RIGHT)
			.scale(TEXTURE_SCALE)
			.build();
	}

	private createTexture(offsetX: number, offsetY: number, width: number, height: number) {
		let texture = PIXI.Texture.from(Assets.SPRITESHEET).clone();
		texture.frame = new PIXI.Rectangle(offsetX, offsetY, width, height);
		return texture;
	}

	private buildBackground(mapLayer: ECS.Container) {
		let texture = PIXI.Texture.from(Assets.LEVEL_BACKGROUND).clone();
		let background = new ECS.Sprite('background', texture);
		background.scale.set(TEXTURE_SCALE);
		mapLayer.addChild(background);
	}
}