import * as PIXI from 'pixi.js';
import { GameModel } from '../model/game-model';
import { ARENA_WIDTH } from '../constants';

const HUD_STYLE_MAIN = new PIXI.TextStyle({
	fill: '#ffffff',
	fontFamily: 'monospace',
	fontSize: 18,
	fontWeight: 'bold',
});

const HUD_STYLE_MULTIPLIER = new PIXI.TextStyle({
	fill: '#ffdd00',
	fontFamily: 'monospace',
	fontSize: 22,
	fontWeight: 'bold',
});

const HUD_STYLE_LABEL = new PIXI.TextStyle({
	fill: '#889aaa',
	fontFamily: 'monospace',
	fontSize: 13,
});

/**
 * Manages the HUD overlay: score, multiplier, lives, bombs.
 * Not an ECS Component — instantiated and driven directly by GameManager.
 */
export class HudController {
	private scoreText: PIXI.Text;
	private multiplierText: PIXI.Text;
	private livesText: PIXI.Text;
	private bombsText: PIXI.Text;

	constructor(layer: PIXI.Container, model: GameModel) {
		this.scoreText = new PIXI.Text('', HUD_STYLE_MAIN);
		this.multiplierText = new PIXI.Text('', HUD_STYLE_MULTIPLIER);
		this.livesText = new PIXI.Text('', HUD_STYLE_MAIN);
		this.bombsText = new PIXI.Text('', HUD_STYLE_MAIN);

		const scoreLabel = new PIXI.Text('SCORE', HUD_STYLE_LABEL);
		const multLabel = new PIXI.Text('MULTI', HUD_STYLE_LABEL);
		const livesLabel = new PIXI.Text('LIVES', HUD_STYLE_LABEL);
		const bombLabel = new PIXI.Text('BOMBS', HUD_STYLE_LABEL);

		// Layout: score top-left, multiplier top-center, lives/bombs top-right
		scoreLabel.position.set(12, 6);
		this.scoreText.position.set(12, 20);

		multLabel.position.set(ARENA_WIDTH / 2 - 30, 6);
		this.multiplierText.position.set(ARENA_WIDTH / 2 - 30, 20);

		livesLabel.position.set(ARENA_WIDTH - 120, 6);
		this.livesText.position.set(ARENA_WIDTH - 120, 20);

		bombLabel.position.set(ARENA_WIDTH - 60, 6);
		this.bombsText.position.set(ARENA_WIDTH - 60, 20);

		layer.addChild(scoreLabel);
		layer.addChild(this.scoreText);
		layer.addChild(multLabel);
		layer.addChild(this.multiplierText);
		layer.addChild(livesLabel);
		layer.addChild(this.livesText);
		layer.addChild(bombLabel);
		layer.addChild(this.bombsText);

		this.update(model);
	}

	update(model: GameModel): void {
		this.scoreText.text = String(model.score);
		this.multiplierText.text = `×${model.multiplier}`;
		this.livesText.text = '♥'.repeat(Math.max(0, model.lives));
		this.bombsText.text = '★'.repeat(Math.max(0, model.bombs));
		this.multiplierText.style.fill = model.multiplier >= 4 ? '#ff4400' : model.multiplier >= 2 ? '#ffdd00' : '#ffffff';
	}
}
