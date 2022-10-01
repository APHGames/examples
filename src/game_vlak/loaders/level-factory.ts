import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, Attributes } from '../constants';
import { Assets } from '../constants';
import { CompletionChecker } from '../components/completion-checker';
import { SoundComponent } from '../components/sound-component';
import { PasswordComponent } from '../components/password-component';
import * as PIXI from 'pixi.js';
import { MapObject } from '../model/game-structs';
import { WaitInputComponent } from '../components/wait-input-component';
import { Actions } from '../actions';
import { Builders } from '../builders';
import { Selectors } from '../selectors';
import { getItemTag } from '../helpers';

/**
 * Factory for levels, uses builders.ts and actions, doesn't execute any business logic
 */
export class LevelFactory {

	/**
	 * Loads a level by an index
	 */
	static loadLevel = (scene: ECS.Scene, index: number) => {
		const gameState = Selectors.gameStateSelector(scene);
		const level = gameState.gameData.levels[index];
		gameState.changeLevel(level);
		LevelFactory.reloadLevel(scene);
	}

	/**
	 * Reloads the current level
	 */
	static reloadLevel = (scene: ECS.Scene) => {
		// recreate the scene from scratch to avoid leftovers from the previous level
		LevelFactory.clearScene(scene);
		const gameState = Selectors.gameStateSelector(scene);
		gameState.reloadLevel();
		// load name of the scene
		Builders.wallTileBuilder(scene).build();
		Builders.levelNameTextBuilder(scene).build();

		// wait for input and load level content
		scene.addGlobalComponentAndRun(new ECS.ChainComponent()
			.waitFor(() => new WaitInputComponent())
			.call(() => scene.callWithDelay(0, () => LevelFactory.loadLevelContent(scene)))
		);
	}

	/**
	 * Loads intro animation
	 */
	static loadIntro = (scene: ECS.Scene) => {
		// recreate the scene from scratch to avoid leftovers from the previous level
		LevelFactory.clearScene(scene);

		const gameState = Selectors.gameStateSelector(scene);
		const intro = gameState.gameData.intro;
		gameState.changeLevel(intro);

		scene.addGlobalComponentAndRun(new CompletionChecker());

		Builders.tilesBuilder(scene, intro).build();
		Builders.trainBuilder(scene, intro.trainInitPos, true).build();

		// wait for key input and load the first level
		scene.addGlobalComponentAndRun(new ECS.ChainComponent()
			.waitFor(() => new WaitInputComponent())
			.mergeWith(Actions.loadNextLevel(scene, 0))
		);
	}

	/**
	 * Loads level content
	 */
	static loadLevelContent = (scene: ECS.Scene) => {
		LevelFactory.clearScene(scene);
		const gameState = Selectors.gameStateSelector(scene);

		const levelState = gameState.currentLevel;
		const trainPos = levelState.levelData.trainInitPos;

		scene.addGlobalComponentAndRun(new CompletionChecker());

		// run fade out animation
		scene.addGlobalComponentAndRun(Actions.wallFade(scene, 'fadeout'));

		scene.addGlobalComponent(new SoundComponent());
		scene.addGlobalComponent(new PasswordComponent());
		// build all objects
		Builders.tilesBuilder(scene, levelState.levelData).build();
		Builders.trainBuilder(scene, trainPos, false).build();
		Builders.levelTextsBuilder(scene).build();
	}

	static destroyGameObject = (scene: ECS.Scene, item: MapObject) => {
		const sprite = scene.findObjectByTag(getItemTag(item.column, item.row));
		sprite.destroy();
	}

	static createTexture = (offsetX: number, offsetY: number) => {
		let texture = PIXI.Texture.from(Assets.SPRITESHEET);
		texture = texture.clone();
		texture.frame = new PIXI.Rectangle(offsetX * SPRITE_SIZE, offsetY * SPRITE_SIZE, SPRITE_SIZE, SPRITE_SIZE);
		return texture;
	}

	static clearScene = (scene: ECS.Scene) => {
		const gameState = Selectors.gameStateSelector(scene);
		scene.clearScene();
		// reassign global attributes and keyboard controller
		scene.stage.sortableChildren = true;
		scene.assignGlobalAttribute(Attributes.GAME_DATA, gameState.gameData);
		scene.assignGlobalAttribute(Attributes.GAME_STATE, gameState);
		const keyInput = Builders.keyboardBuilder();
		scene.addGlobalComponentAndRun(keyInput);
		scene.assignGlobalAttribute('key_input', keyInput);
	}
}