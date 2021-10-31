import * as ECS from '../../libs/pixi-ecs';
import { isMobileDevice } from '../../libs/pixi-ecs/utils/helpers';
import { MapPosition, LevelData, ObjectTypes } from './model/game-structs';
import { LevelFactory } from './loaders/level-factory';
import { Tags, SPRITE_SIZE, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A, TEXT_COLOR_B, TEXT_COLOR_C, LEVEL_ROWS, LEVEL_COLUMNS } from './constants';
import { Selectors } from './selectors';
import { TrainSyncComponent } from './components/train-sync-component';
import { TrainIntroController } from './components/train-intro-controller';
import { getItemTexOffset, getItemTag, getCarTexOffset } from './helpers';
import { ItemAnimator } from './animators/item-animator';
import { ScoreCounter } from './components/score-counter';
import { RailcarSyncComponent } from './components/railcar-sync-component';
import { CarState } from './model/state-structs';
import { FuncComponent } from '../../libs/pixi-ecs/components/func-component';
import { TrainKeyboardController } from './components/train-keyboard-controller';

/**
 * Builders for game objects, orchestrated by factories for more complex assembling
 */
export class Builders {

	static keyboardBuilder = () => {
		let keyboard = null;
		if (isMobileDevice() || new URLSearchParams(window.location.search).has('mobile')) {
			// add virtual gamepad for mobile devices
			keyboard = new ECS.VirtualGamepadComponent({
				KEY_UP: ECS.Keys.KEY_UP,
				KEY_DOWN: ECS.Keys.KEY_DOWN,
				KEY_LEFT: ECS.Keys.KEY_LEFT,
				KEY_RIGHT: ECS.Keys.KEY_RIGHT,
				KEY_X: 8,
				KEY_Y: ECS.Keys.KEY_SPACE
			});
		} else {
			keyboard = new ECS.KeyInputComponent();
		}
		return keyboard;
	};

	static trainBuilder = (scene: ECS.Scene, initPos: MapPosition, isIntro: boolean) => {
		const gameState = Selectors.gameStateSelector(scene);
		// place the train
		const builder = new ECS.Builder(scene)
			.withName('train')
			.withTag(Tags.TRAIN)
			.asSprite(LevelFactory.createTexture(0, 7))
			.localPos(initPos.column * SPRITE_SIZE, initPos.row * SPRITE_SIZE)
			.withComponent(new TrainSyncComponent(gameState.currentLevel.trainState))
			.withParent(scene.stage);

		if (isIntro) {
			builder.withComponent(new TrainIntroController(gameState.currentLevel.trainState));
		} else {
			builder.withComponent(new TrainKeyboardController(gameState.currentLevel.trainState));
		}

		return builder;
	}

	static trainCarBuilder = (scene: ECS.Scene, state: CarState) => {
		const { x, y } = getCarTexOffset(state.type);

		return new ECS.Builder(scene)
			.asSprite(LevelFactory.createTexture(x, y))
			.localPos(state.position.column * SPRITE_SIZE, state.position.row * SPRITE_SIZE)
			.withParent(scene.stage)
			.withComponent(new RailcarSyncComponent(state));
	}

	static tilesBuilder = (scene: ECS.Scene, level: LevelData) => {
		const parentBuilder = new ECS.Builder(scene)
			.asContainer()
			.withName('tilesLayer')
			.withParent(scene.stage);


		for (let obj of level.allObjects) {
			if (obj.type !== ObjectTypes.EMPTY) {
				const { x, y } = getItemTexOffset(obj.type);
				const childBuilder = new ECS.Builder(scene)
					.asSprite(LevelFactory.createTexture(x, y))
					.localPos(obj.column * SPRITE_SIZE, obj.row * SPRITE_SIZE)
					.withTag(Tags.GAMEOBJECT)
					.withTag(getItemTag(obj.column, obj.row));

				if (obj.type === ObjectTypes.DOOR) {
					childBuilder.withTag(Tags.DOOR);
				}
				if (obj.isItem) {
					// items are animated
					childBuilder.withComponent(new ItemAnimator());
				}
				// append the builder to the hierarchy
				parentBuilder.withChild(childBuilder);
			}
		}

		return parentBuilder;
	}

	static wallTileBuilder = (scene: ECS.Scene) => {
		const { x, y } = getItemTexOffset(ObjectTypes.WALL);
		return new ECS.Builder(scene)
			.asTilingSprite(LevelFactory.createTexture(x, y), LEVEL_COLUMNS * SPRITE_SIZE, LEVEL_ROWS * SPRITE_SIZE)
			.withComponent(new ECS.FuncComponent('').doOnInit((cmp) => {
				// a small hack to set zIndex in the ECS.Builder
				cmp.owner.zIndex = 10;
				cmp.finish();
			}))
			.withParent(scene.stage);
	}

	static levelTextsBuilder = (scene: ECS.Scene) => {
		const gameState = Selectors.gameStateSelector(scene);

		return new ECS.Builder(scene).withParent(scene.stage)
			.withChild(new ECS.Builder(scene)
				.asBitmapText('SKORE', DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.localPos(0, SPRITE_SIZE * 12 + 1))
			.withChild(new ECS.Builder(scene)
				.asBitmapText('0', DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B)
				.localPos(FONT_SIZE_PX * 7, SPRITE_SIZE * 12 + 1)
				// there is a weird bug for which adding ScoreCounter directly does accept messages
				.withComponent(new ScoreCounter()))
			.withChild(new ECS.Builder(scene)
				.asBitmapText('H HESLO', DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_C)
				.withTag(Tags.PASSWORD)
				.localPos(FONT_SIZE_PX * 16, SPRITE_SIZE * 12 + 1)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText('SCENA', DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.localPos(FONT_SIZE_PX * 32, SPRITE_SIZE * 12 + 1)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(gameState.currentLevelIndex + 1 + '', DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B)
				.localPos(FONT_SIZE_PX * 38, SPRITE_SIZE * 12 + 1)
			);
	}

	static levelNameTextBuilder = (scene: ECS.Scene) => {
		const gameState = Selectors.gameStateSelector(scene);
		// BitmapText doesn't support multiple colors. Hence, each colored string must have a dedicated object
		const textA = 'SCENA';
		const textB = `${gameState.currentLevelIndex + 1}`;
		const textC = 'heslo';
		const textD = `${gameState.currentLevel.levelData.name.toUpperCase()}`;


		return new ECS.Builder(scene).withParent(scene.stage)
			// this is a little hack - ECS.Builder doesn't have zIndex option, thus we will add a dummy func component
			// that would set it up during the onInit function
			.withComponent(new ECS.FuncComponent('').doOnInit((cmp) => cmp.owner.zIndex = 18))
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textA, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.withName('scnTextA')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textA.length + textB.length + 1) / 2)), FONT_SIZE_PX * 12)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textB, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B)
				.withName('scnTextB')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textA.length + textB.length + 1) / 2) + textA.length + 1), FONT_SIZE_PX * 12)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textC, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.withName('scnTextC')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textC.length + textD.length + 1) / 2)), FONT_SIZE_PX * 14)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textD, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B)
				.withName('scnTextD')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textC.length + textD.length + 1) / 2) + textC.length + 1), FONT_SIZE_PX * 14)
			)
			.withChild(new ECS.Builder(scene)
				.asGraphics()
				.withComponent(new ECS.FuncComponent('').doOnInit((cmp) => {
					const scnTextA = cmp.scene.findObjectByName('scnTextA');
					const scnTextB = cmp.scene.findObjectByName('scnTextB');
					const scnTextC = cmp.scene.findObjectByName('scnTextC');
					const scnTextD = cmp.scene.findObjectByName('scnTextD');

					const rect = cmp.owner.asGraphics();
					rect.beginFill(0x000000);
					const x = Math.min(scnTextA.position.x, scnTextC.position.x);
					const y = Math.min(scnTextA.position.y, scnTextC.position.y);
					rect.drawRect(x, y,
						Math.max(scnTextB.getBounds().right, scnTextD.getBounds().right) - x,
						Math.max(scnTextB.getBounds().bottom, scnTextD.getBounds().bottom) - y);
					rect.endFill();
					rect.zIndex = 10;
					scnTextA.zIndex = scnTextB.zIndex = scnTextC.zIndex = scnTextD.zIndex = 12;
					scnTextA.parent.sortableChildren = true;
				}))
			);
	}

	static endInfoBuilder = (scene: ECS.Scene) => {
		const textA = 'B L A H O P R E J I  !';
		const textB = 'Stal jste se absolutnim';
		const textC = 'vitezem teto hry !';

		return new ECS.Builder(scene).withParent(scene.stage)
			// this is a little hack - ECS.Builder doesn't have zIndex option, thus we will add a dummy func component
			// that would set it up during the onInit function
			.withComponent(new ECS.FuncComponent('').doOnInit((cmp) => cmp.owner.zIndex = 18))
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textA, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_B)
				.withName('endTextA')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textA.length) / 2)), FONT_SIZE_PX * 10)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textB, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.withName('endTextB')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textB.length) / 2)), FONT_SIZE_PX * 12)
			)
			.withChild(new ECS.Builder(scene)
				.asBitmapText(textC, DEFAULT_FONT, FONT_SIZE_PX, TEXT_COLOR_A)
				.withName('endTextC')
				.localPos(FONT_SIZE_PX * (40 / 2 - Math.ceil((textC.length) / 2)), FONT_SIZE_PX * 13)
			)
			.withChild(new ECS.Builder(scene)
				.asGraphics()
				.withComponent(new ECS.FuncComponent('').doOnInit((cmp) => {
					const endTextA = cmp.scene.findObjectByName('endTextA');
					const endTextB = cmp.scene.findObjectByName('endTextB');
					const endTextC = cmp.scene.findObjectByName('endTextC');

					const rect = cmp.owner.asGraphics();
					rect.beginFill(0x000000);
					const x = endTextB.position.x;
					const y = endTextA.position.y;
					rect.drawRect(x, y, endTextB.getBounds().right - x, endTextC.getBounds().bottom - y);
					rect.endFill();
					rect.zIndex = 10;
					endTextA.zIndex = endTextB.zIndex = endTextC.zIndex = 12;
					endTextA.parent.sortableChildren = true;
				}))
			);
	}

	static introTextBuilder = (scene: ECS.Scene, column: number, posX: number, posY: number) => {
		return new ECS.Builder(scene)
			.asSprite(LevelFactory.createTexture(column - 2, 11))
			.withParent(scene.stage)
			.localPos(posX, posY);
	}
}