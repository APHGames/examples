import * as PIXI from 'pixi.js';
import * as ECS from '../../libs/pixi-ecs';
import { CLISpriteRenderer } from './cli-renderer/cli-sprite-renderer';
import { GameKeyboardController } from './components/game-controller';
import { GameRenderer } from './components/game-renderer';
import { Assets, GAME_COLUMNS, GAME_ROWS, GAME_EXTRA_ROWS, CLI_COLS, CLI_ROWS } from './constants';
import { GameModel } from './model/game-model';
import { IntroComponent } from './components/intro-component';
import { LevelSelector } from './components/level-selector';
import { HighScoreSaver } from './components/highscore-saver';
import { CGAColors } from './cli-renderer/cli-renderer-base';
import { SoundComponent } from './components/sound-component';

export class Factory {
	loadIntro(scene: ECS.Scene) {
		scene.clearScene();
		const text = this.buildCLI(scene);
		scene.addGlobalComponentAndRun(text);
		scene.addGlobalComponentAndRun(new ECS.KeyInputComponent());
		scene.addGlobalComponentAndRun(new IntroComponent());
	}

	loadLevelSelector(scene: ECS.Scene) {
		scene.clearScene();
		const text = this.buildCLI(scene);
		scene.addGlobalComponentAndRun(text);
		scene.addGlobalComponentAndRun(new ECS.KeyInputComponent());
		scene.addGlobalComponentAndRun(new LevelSelector());
	}

	loadHighScoreSaver(scene: ECS.Scene, score: number) {
		scene.clearScene();
		const text = this.buildCLI(scene);
		scene.addGlobalComponentAndRun(text);
		scene.addGlobalComponentAndRun(new ECS.KeyInputComponent());
		scene.addGlobalComponentAndRun(new HighScoreSaver(score));
	}

	loadGame(scene: ECS.Scene, level: number = 0) {
		scene.clearScene();
		const text = this.buildCLI(scene);
		const model = new GameModel(GAME_COLUMNS, GAME_ROWS, GAME_EXTRA_ROWS, level);
		scene.addGlobalComponentAndRun(text);
		scene.addGlobalComponentAndRun(new ECS.KeyInputComponent());
		scene.addGlobalComponentAndRun(new GameKeyboardController(model));
		scene.addGlobalComponentAndRun(new GameRenderer({ model }));
		scene.addGlobalComponentAndRun(new SoundComponent());
	}

	private buildCLI(scene: ECS.Scene) {
		const fontTexture = PIXI.Texture.from(Assets.FONT_DOS_TEXTURE);
		const xmlContent = scene.app.loader.resources[Assets.FONT_DOS].data;
		const xmlParsed = new DOMParser().parseFromString(xmlContent, 'text/xml');

		const text = new CLISpriteRenderer({
			columns: CLI_COLS,
			rows: CLI_ROWS,
			fontDefinition: xmlParsed,
			fontTexture: fontTexture,
			textColor: CGAColors.WHITE,
			highlightColor: CGAColors.LBLUE,
			highlightedTextColor: CGAColors.WHITE,
		});
		return text;
	}
}