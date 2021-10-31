import * as ECS from '../../libs/pixi-ecs';
import { WallfadeAnimator } from './animators/wallfade-animator';
import { Messages, Tags, SPRITE_SIZE } from './constants';
import { DoorAnimator } from './animators/door-animator';
import { ObjectTypes } from './model/game-structs';
import { TrainCrashAnimator } from './animators/train-crash-animator';
import { TrainState } from './model/state-structs';
import { LevelFactory } from './loaders/level-factory';
import { Selectors } from './selectors';
import { Builders } from './builders';
import { WaitInputComponent } from './components/wait-input-component';
import { dirToCoordIncrement } from './helpers';

/**
 * Action functions - these functions use ECS.ChainComponent and can be therefore used for more complex sequences,
 * such as: waiting, reloading the level, clearing up the scene, etc.
 *
 */
export class Actions {

	/**
	 * Loads intro with a slight delay
	 */
	static loadIntro = (scene: ECS.Scene) => {
		return new ECS.ChainComponent()
			// callWithDelay is important here, because we can't clear the scene in the middle
			// of an update loop. Therefore, if we want to execute anything that calls .clearScene(),
			// we must use callWithDelay, so that the scene will be cleared up in the end of the update loop
			.call(() => scene.callWithDelay(200, () => LevelFactory.loadIntro(scene)));
	}

	/**
	 * Loads the next level
	 */
	static loadNextLevel = (scene: ECS.Scene, delay = 1000) => {
		return new ECS.ChainComponent()
			.waitTime(delay)
			.waitFor(Actions.wallFade(scene, 'fadein'))
			.call((cmp) => {
				const gameState = Selectors.gameStateSelector(scene);

				if (gameState.currentLevelIndex === (gameState.gameData.levels.length - 1)) {
					// game over -> load ending text
					cmp.mergeWith(new ECS.ChainComponent()
						.call(() => Builders.endInfoBuilder(scene).build())
						.waitFor(() => new WaitInputComponent())
						.call(() => scene.callWithDelay(0, () => LevelFactory.loadIntro(scene)))
					);
				} else {
					// load the next level
					cmp.mergeWith(new ECS.ChainComponent()
						.call(() => scene.callWithDelay(0, () => LevelFactory.loadLevel(scene, gameState.currentLevelIndex + 1))));
				}
			});
	}

	/**
	 * Loads a level by given index
	 */
	static loadLevelByIndex = (scene: ECS.Scene, index: number) => {
		return new ECS.ChainComponent()
			.waitFor(Actions.wallFade(scene, 'fadein'))
			.call(() => scene.callWithDelay(0, () => LevelFactory.loadLevel(scene, index)));
	}

	/**
	 * Completes a level and either loads the next one or re-loads the intro level,
	 * in case the intro itself has ended
	 */
	static completeLevel = (scene: ECS.Scene) => {
		return new ECS.ChainComponent()
			.call((cmp) => cmp.sendMessage(Messages.LEVEL_COMPLETED))
			.call((cmp) => {
				const levelState = Selectors.gameStateSelector(scene).currentLevel;
				if (levelState.levelData.name === 'intro') {
					cmp.mergeWith(Actions.loadIntro(scene));
				} else {
					cmp.mergeWith(Actions.loadNextLevel(scene));
				}
			});
	}

	/**
	 * Opens the door
	 */
	static openDoor = (scene: ECS.Scene) => {
		return new ECS.ChainComponent()
			.call(() => {
				const levelState = Selectors.gameStateSelector(scene).currentLevel;
				levelState.openDoor();
				const doorSprite = scene.findObjectByTag(Tags.DOOR);
				doorSprite.addComponent(new DoorAnimator());
			});
	}

	/**
	 * Tries to move the train and either executes crash animation or applies the movement
	 */
	static moveTrain = (scene: ECS.Scene, trainState: TrainState) => {

		let { x, y } = dirToCoordIncrement(trainState.position.direction);
		const newColumn = trainState.position.column + x;
		const newRow = trainState.position.row + y;
		const gameState = Selectors.gameStateSelector(scene);
		const levelState = gameState.currentLevel;

		// check out if there is an object in our way
		const targetObject = levelState.getMapObject(newColumn, newRow);
		if (targetObject.type === ObjectTypes.WALL || (targetObject.type === ObjectTypes.DOOR && !levelState.doorOpen)) {
			// the train has crashed to the wall or closed door
			return Actions.crashTrain(scene, trainState);
		}

		// in terms of collisions with other cars, we can only move to the position of the last car, because as the train moves, so will the last car
		const blockingCarIdx = trainState.cars.findIndex(car => car.position.column === newColumn && car.position.row === newRow);
		if (blockingCarIdx !== -1 && blockingCarIdx !== (trainState.cars.length - 1)) {
			return Actions.crashTrain(scene, trainState);
		}

		// apply train movement
		return new ECS.ChainComponent()
			.call(() => {
				// add new car
				if (targetObject.isItem) {
					levelState.pickItem(newColumn, newRow);
					const newCar = trainState.addItemToTail(targetObject.type);
					LevelFactory.destroyGameObject(scene, targetObject);
					Builders.trainCarBuilder(scene, newCar).build();
				}

				// update all cars in the state
				trainState.applyMovement();
				const trainSprite = scene.findObjectByTag(Tags.TRAIN);
				trainSprite.position.set(newColumn * SPRITE_SIZE, newRow * SPRITE_SIZE);
			});
	}

	/**
	 * Executes train crash animation and reloads the level
	 */
	static crashTrain = (scene: ECS.Scene, trainState: TrainState) => {
		return new ECS.ChainComponent()
			.call(() => {
				trainState.crashTrain();
				const train = scene.findObjectByTag(Tags.TRAIN);
				train.addComponent(new TrainCrashAnimator());
			})
			.waitTime(2000)
			.call(() => scene.callWithDelay(0, () => LevelFactory.reloadLevel(scene)));
	}

	/**
	 * Inits wall-fade animation and returns the animator that
	 * can be used for the waiting closure
	 */
	static wallFade = (scene: ECS.Scene, type: 'fadein' | 'fadeout') => {
		return new ECS.ChainComponent().waitFor(() => {
			const wallFade = new WallfadeAnimator({ type });
			const wallSprite = Builders.wallTileBuilder(scene).build();
			wallSprite.addComponentAndRun(wallFade);
			return wallFade;
		});
	}
}