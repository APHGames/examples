import {
	Builder,
	KeyInputComponent,
	Scene,
	Sprite,
	Container,
} from 'colfio';
import * as PIXI from 'pixi.js';
import { getLoadedTexture, textureFromFrame } from '../../utils/assets';
import { LifeDisplayComponent } from './Components/LifeDisplayComponent';
import { BallPhysicsComponent } from './Components/BallPhysicsComponent';
import { GameComponent } from './Components/GameComponent';
import {
	ATTR_FACTORY,
	TEXTURE_ARKANOID,
	TAG_TITLE,
	TAG_SHIP,
	TAG_BRICKS,
	TAG_LEFT_PANEL,
	TAG_RIGHT_PANEL,
	TAG_TOP_PANEL,
	TAG_PADDLE,
	TAG_BALL,
	TAG_LIFE,
	TAG_STATUS,
	ATTR_MODEL,
} from './Constants';
import { Model, SpriteInfo } from './Model';
import { SoundComponent } from './Components/SoundComponent';
import { BrickCollisionResolver } from './Components/BrickCollisionResolver';
import { IntroComponent } from './Components/IntroComponent';
import { DynamicsComponent, ATTR_DYNAMICS } from './utils/DynamicsComponent';
import Dynamics from './utils/Dynamics';
import { PaddleInputController } from './Components/PaddleComponent';
import { StatusComponent } from './Components/StatusComponent';
import { LifeLostWatcher } from './Components/LifeLostWatcher';

export class Factory {
	static globalScale = 1;

	initializeLevel(scene: Scene, model: Model) {
		if (model.currentLevel == 0) {
			this.addIntro(scene, model);
		} else {
			model.initLevel();
			this.addPanels(scene, model);
			this.addBricks(scene, model);
			this.addPaddle(scene, model);
			this.addLives(scene, model);
			this.addStatus(scene, model);

			scene.addGlobalComponent(new SoundComponent());
			scene.addGlobalComponent(new BrickCollisionResolver());
			scene.addGlobalComponent(new GameComponent());
			scene.addGlobalComponent(new LifeLostWatcher());
		}
	}

	addIntro(scene: Scene, model: Model) {
		new Builder(scene)
			.withComponent(new SoundComponent())
			.withComponent(new IntroComponent())
			.buildInto(scene.stage);

		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_TITLE)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_TITLE)))
			.relativePos(0.5, 0.25)
			.anchor(0.5)
			.scale(Factory.globalScale)
			.build();

		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_SHIP)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_SHIP)))
			.relativePos(0.5, 0.75)
			.anchor(0.5)
			.scale(Factory.globalScale)
			.build();
	}

	addBricks(scene: Scene, model: Model) {
		const bricks = new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_BRICKS)
			.asContainer()
			.build() as Container;

		model.brickSprites.clear();
		for (const [, val] of model.bricks) {
			const spriteIndex = val.type - 1;
			const sprite = new Builder(scene)
				.withParent(bricks)
				.asSprite(this.createTexture(model.getSpriteInfo(TAG_BRICKS), spriteIndex))
				.scale(Factory.globalScale)
				.localPos(val.position.x * 2 + 1, val.position.y + 1)
				.build() as Sprite;

			model.brickSprites.set(sprite.id, val);
		}
	}

	addPanels(scene: Scene, model: Model) {
		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_LEFT_PANEL)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_LEFT_PANEL)))
			.scale(Factory.globalScale)
			.build();

		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_RIGHT_PANEL)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_RIGHT_PANEL)))
			.scale(Factory.globalScale)
			.localPos(23, 0)
			.build();

		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_TOP_PANEL)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_TOP_PANEL)))
			.scale(Factory.globalScale)
			.build();
	}

	addPaddle(scene: Scene, model: Model) {
		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_PADDLE)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_PADDLE)))
			.scale(Factory.globalScale)
			.localPos(10, 23)
			.withComponent(new PaddleInputController())
			.build();

		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_BALL)
			.asSprite(this.createTexture(model.getSpriteInfo(TAG_BALL)))
			.scale(Factory.globalScale)
			.localPos(10 + model.ballOffset, 22.4)
			.withAttribute(ATTR_DYNAMICS, new Dynamics())
			.withComponent(new DynamicsComponent())
			.withComponent(new BallPhysicsComponent())
			.build();
	}

	addLives(scene: Scene, model: Model) {
		for (let i = 1; i <= model.currentLives; i++) {
			new Builder(scene)
				.withParent(scene.stage)
				.withName(TAG_LIFE + '_' + i)
				.asSprite(this.createTexture(model.getSpriteInfo(TAG_LIFE)))
				.scale(Factory.globalScale)
				.localPos(1 + 2 * (i - 1), 24)
				.build();
		}
		scene.stage.addComponent(new LifeDisplayComponent());
	}

	addStatus(scene: Scene, model: Model) {
		new Builder(scene)
			.withParent(scene.stage)
			.withName(TAG_STATUS)
			.asText(
				'',
				new PIXI.TextStyle({
					fontFamily: ['Comfont', 'Arial', 'sans-serif'],
					fill: '#ffffff',
					fontSize: 16,
				}),
			)
			.scale(Factory.globalScale)
			.localPos(8, 15)
			.withComponent(new StatusComponent())
			.build();
	}

	resetGame(scene: Scene, model: Model) {
		const apply = () => {
			this.recycleStage(scene);
			scene.assignGlobalAttribute(ATTR_FACTORY, this);
			scene.assignGlobalAttribute(ATTR_MODEL, model);
			scene.addGlobalComponent(new KeyInputComponent());
			this.initializeLevel(scene, model);
		};

		// Intro / game-over call this from callWithDelay (still on the update
		// stack). clearScene() also destroys Pixi 8's live app.stage.
		setTimeout(apply, 0);
	}

	private recycleStage(scene: Scene) {
		scene.stage.destroyChildren();
		const leftover = [...scene.stage._proxy.rawComponents.values()];
		for (const cmp of leftover) {
			scene.stage.removeComponent(cmp);
		}
	}

	createTexture(spriteInfo: SpriteInfo, index: number = 0): PIXI.Texture {
		return textureFromFrame(
			getLoadedTexture(TEXTURE_ARKANOID),
			spriteInfo.offsetX + spriteInfo.width * index,
			spriteInfo.offsetY,
			spriteInfo.width,
			spriteInfo.height,
		);
	}
}
