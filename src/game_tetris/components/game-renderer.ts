import * as ECS from '../../../libs/pixi-ecs';
import { GameModel } from '../model/game-model';
import { Symbols, CGAColors } from '../cli-renderer/cli-renderer-base';
import { SHAPES, CELL_PLAYER, CELL_PLACED } from '../model/tetrominos';
import { Messages } from '../constants';
import { CLISpriteRenderer } from '../cli-renderer/cli-sprite-renderer';

const defaultColor = CGAColors.WHITE;
const playerColor = CGAColors.LBLUE;

// =====================================
// Coordinates for respective panels
const statsBox = {
	x: 8,
	y: 0,
	w: 18,
	h: 26
};

const gameBox = {
	x: 28,
	y: 3,
	w: 22,
	h: 24
};

const linesBox = {
	x: gameBox.x,
	y: 0,
	w: gameBox.w,
	h: 3
};

const scoreBox = {
	x: 52,
	y: 0,
	w: 20,
	h: 5
};

const nextBox = {
	x: scoreBox.x,
	y: scoreBox.y + scoreBox.h,
	w: 12,
	h: 5
};

const levelBox = {
	x: nextBox.x,
	y: nextBox.y + nextBox.h,
	w: nextBox.w,
	h: 4
};

/**
 * Rendering component for the game board
 */
export class GameRenderer extends ECS.Component<{ model: GameModel }> {

	cli: CLISpriteRenderer;
	statsOffsets: Map<string, number>;
	paused: boolean;

	onInit() {
		this.cli = this.scene.findGlobalComponentByName(CLISpriteRenderer.name);
		this.cli.changeColors(defaultColor, CGAColors.BLACK);
		this.statsOffsets = new Map();
		this.paused = false;
		this.subscribe(Messages.ROW_CLEARED, Messages.GAME_OVER);
	}

	onMessage(msg: ECS.Message) {
		if (msg.action === Messages.ROW_CLEARED) {
			this.runRowClearAnimation(msg.data as number[]);
		} else if (msg.action === Messages.GAME_OVER) {
			this.runGameOverAnimation();
		}
	}

	onAttach() {
		this.initGameBoard();
	}

	onUpdate() {
		if (!this.paused) {
			this.drawModel();
			this.drawStats();
		}
	}

	initGameBoard() {
		// statistics
		this.cli.drawBox(statsBox.x, statsBox.y, statsBox.w, statsBox.h);
		this.cli.drawText('STATISTICS', statsBox.x + 1, statsBox.y + 1, 'center', statsBox.w - 2);

		let rowCounter = 3;
		for (let shape of SHAPES) {
			for (let i = 0; i < shape.data.length; i++) {
				for (let j = 0; j < shape.data[i].length; j++) {
					if (shape.data[i][j] === 1) {
						this.cli.drawText('▐█', statsBox.x + 2 + j * 2, statsBox.y + i + rowCounter + 1);
						this.statsOffsets.set(shape.name, rowCounter);
					}
				}
			}

			rowCounter += 3;
		}

		// lines
		this.cli.drawBox(linesBox.x, linesBox.y, linesBox.w, linesBox.h);
		this.cli.drawText('LINES', linesBox.x + 2, linesBox.y + 1);
		// top and score
		this.cli.drawBox(scoreBox.x, scoreBox.y, scoreBox.w, scoreBox.h);
		this.cli.drawText('SCORE', scoreBox.x + 2, scoreBox.y + 1);
		// next
		this.cli.drawBox(nextBox.x, nextBox.y, nextBox.w, nextBox.h);
		this.cli.drawText('NEXT', nextBox.x + 1, nextBox.y + 1, 'center', nextBox.w - 2);
		// level
		this.cli.drawBox(levelBox.x, levelBox.y, levelBox.w, levelBox.h);
		this.cli.drawText('LEVEL', levelBox.x + 2, levelBox.y + 1);

		this.cli.drawText('Press Arrows for moving and A/S for rotations',
			levelBox.x, levelBox.y + levelBox.h + 2, 'left', 12);
		// main box
		this.cli.drawBox(gameBox.x, gameBox.y, gameBox.w, gameBox.h);
		// filling of the main box
		this.drawBoxContent();
		this.runGameInitAnimation();
	}

	drawModel() {
		const { model } = this.props;
		this.drawBoxContent();

		for (let i = 0; i < model.rows; i++) {
			for (let j = 0; j < model.columns; j++) {
				const cellType = model.cellTypeAt(new ECS.Vector(j, i + model.extraRows));
				// don't render extra rows
				if (cellType === CELL_PLAYER) {
					this.drawCell(new ECS.Vector(j, i), playerColor);
				} else if (cellType === CELL_PLACED) {
					this.drawCell(new ECS.Vector(j, i), defaultColor);
				}
			}
		}
	}

	drawStats() {
		const stats = this.props.model.getStats();

		for (let shape of SHAPES) {
			this.cli.drawText(this.pad(stats.shapesGenerated.get(shape.name) || 0, 3),
				statsBox.x + 12, statsBox.y + this.statsOffsets.get(shape.name) + 1);
		}

		this.cli.drawText(`LINES-${this.pad(stats.removedRows, 3)}`, linesBox.x + 2, linesBox.y + 1);
		this.cli.drawText(this.pad(this.props.model.currentScore, 6), scoreBox.x + 2, scoreBox.y + 3);

		const next = stats.nextShape;
		if (next) {
			this.cli.drawPattern(' ', nextBox.x + 1, nextBox.y + 2, nextBox.w - 2, 2);
			for (let i = 0; i < next.data.length; i++) {
				for (let j = 0; j < next.data[i].length; j++) {
					if (next.data[i][j] === 1) {
						const offset = next.name === 'STRAIGHT' ? 1 : 3;
						this.cli.drawText('▐█', nextBox.x + offset + j * 2, nextBox.y + i + 2);
					}
				}
			}
		}

		this.cli.drawText(this.pad(this.props.model.currentLevel, 2), levelBox.x + 2, levelBox.y + 2);
	}

	drawBoxContent() {
		this.cli.drawPattern('. ', gameBox.x + 1, gameBox.y + 1, gameBox.w - 2, gameBox.h - 4);
	}

	drawCell(pos: ECS.Vector, color: number = defaultColor) {
		if (color !== defaultColor) {
			this.cli.changeColors(color, CGAColors.BLACK);
		}

		this.cli.drawChar(Symbols.DECOR_FRIGHT, gameBox.x + pos.x * 2 + 1, gameBox.y + pos.y + 1);
		this.cli.drawChar(Symbols.DECOR_FILL, gameBox.x + pos.x * 2 + 2, gameBox.y + pos.y + 1);

		if (color !== defaultColor) {
			this.cli.resetColors();
		}
	}

	runGameInitAnimation() {
		this.cli.drawPattern('#', gameBox.x + 1, gameBox.y + 1, gameBox.w - 2, gameBox.h - 4);
		this.sendMessage(Messages.CONTROLLER_BLOCK);
		this.paused = true;
		let rowCounter = 0;
		this.owner.addComponentAndRun(
			new ECS.ChainComponent()
				.beginWhile(() => rowCounter < this.props.model.rows)
				.waitTime(40)
				.call(() => {
					this.cli.drawPattern('. ', gameBox.x + 1, gameBox.y + 1 + rowCounter, gameBox.w - 2, 1);
					rowCounter++;
				})
				.endWhile()
				.call(() => {
					this.sendMessage(Messages.CONTROLLER_RUN);
					this.paused = false;
				})
		);
	}

	runGameOverAnimation() {
		// draw the most recent state and execute the animation
		this.drawModel();
		this.sendMessage(Messages.CONTROLLER_BLOCK);
		this.paused = true;
		let rowCounter = 0;
		// wait for 1 second and draw ######## over the game board
		this.owner.addComponentAndRun(
			new ECS.ChainComponent()
				.waitTime(1000)
				.beginWhile(() => rowCounter < this.props.model.rows)
				.waitTime(40)
				.call(() => {
					this.cli.drawRow('#', gameBox.x + 1, gameBox.y + 1 + rowCounter, gameBox.w - 2);
					rowCounter++;
				})
				.endWhile()
				.call(() => {
					this.sendMessage(Messages.CONTROLLER_RUN);
				})
		);
	}

	runRowClearAnimation(rows: number[]) {
		// stop the controller
		this.sendMessage(Messages.CONTROLLER_BLOCK);
		this.paused = true;
		let colCounter = 0;
		// clear rows with a 60ms delay
		this.owner.addComponentAndRun(
			new ECS.ChainComponent()
				.beginWhile(() => colCounter < this.props.model.columns / 2)
				.waitTime(60)
				.call(() => {
					const center = Math.floor(this.props.model.columns / 2);
					for (let row of rows) {
						this.cli.drawChar(' ', gameBox.x + (center + colCounter) * 2 + 1, gameBox.y + row + 1);
						this.cli.drawChar(' ', gameBox.x + (center + colCounter) * 2 + 2, gameBox.y + row + 1);
						this.cli.drawChar(' ', gameBox.x + (center - colCounter) * 2 + 1, gameBox.y + row + 1);
						this.cli.drawChar(' ', gameBox.x + (center - colCounter) * 2 + 2, gameBox.y + row + 1);
					}
					colCounter++;
				})
				.endWhile()
				.call(() => {
					this.sendMessage(Messages.CONTROLLER_RUN);
					this.paused = false;
				})
		);
	}

	private pad(n: number, width: number) {
		const nStr = n + '';
		return nStr.length >= width ? nStr : new Array(width - nStr.length + 1).join('0') + n;
	}
}