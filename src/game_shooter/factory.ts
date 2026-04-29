import * as ECS from '../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { createInitialModel } from './model/game-model';
import { GameManager } from './components/game-manager';
import { Tags, ARENA_WIDTH, ARENA_HEIGHT } from './constants';

/**
 * Builds the initial scene for the shooter game.
 * Uses PIXI.Graphics exclusively — no texture assets are required.
 */
export class Factory {
	loadGame(scene: ECS.Scene, seed?: number): void {
		scene.clearScene({
			tagsSearchEnabled: true,
			namesSearchEnabled: true,
		});

		// ── Layer hierarchy (render order: arena → entities → hud) ──────
		const arenaLayer = new ECS.Container('arenaLayer');
		const entityLayer = new ECS.Container('entityLayer');
		const hudLayer = new ECS.Container('hudLayer');
		scene.stage.addChild(arenaLayer);
		scene.stage.addChild(entityLayer);
		scene.stage.addChild(hudLayer);

		// ── Keyboard input (global component + global attribute) ────────
		const keyInput = new ECS.KeyInputComponent();
		scene.addGlobalComponentAndRun(keyInput);
		scene.assignGlobalAttribute('key_input', keyInput);

		// ── Initial game model ──────────────────────────────────────────
		const model = createInitialModel(seed ?? Date.now());

		// ── "Controls" hint text ────────────────────────────────────────
		const hintStyle = new PIXI.TextStyle({
			fill: '#445566',
			fontFamily: 'monospace',
			fontSize: 12,
		});
		const hint = new PIXI.Text('WASD / mouse → move & aim  |  SPACE → fire  |  B → bomb', hintStyle);
		hint.position.set(ARENA_WIDTH / 2 - hint.width / 2, ARENA_HEIGHT - 20);
		(hudLayer as unknown as PIXI.Container).addChild(hint);

		// ── Global GameManager component ────────────────────────────────
		const gameManagerContainer = new ECS.Container('gameManagerContainer');
		gameManagerContainer.assignAttribute('model', model);
		scene.stage.addChild(gameManagerContainer);

		const gameManager = new GameManager();
		gameManagerContainer.addComponent(gameManager);
	}
}
