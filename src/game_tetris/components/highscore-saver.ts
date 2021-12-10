import * as ECS from '../../../libs/pixi-ecs';
import { CLISpriteRenderer } from '../cli-renderer/cli-sprite-renderer';
import { Factory } from '../factory';
import { GAME_CONFIG } from '../constants';

const storageKey = 'tetris-score';
const maxNameLength = 10;

type HighScore = {
	name: string;
	score: number;
}[]

/**
 * Component that renders the current highscore and allows the player to enter a new one
 */
export class HighScoreSaver extends ECS.Component<number> {

	cli: CLISpriteRenderer;
	keyInput: ECS.KeyInputComponent;
	highScore: HighScore;
	inputName: string = '';
	currentPlace = 0; // winning place
	pointerPos = 0; // input field pointer
	highlightFlag = true; // flickering cursor
	frameCounter = 0;

	onInit() {
		this.cli = this.scene.findGlobalComponentByName(CLISpriteRenderer.name);
		this.keyInput = this.scene.findGlobalComponentByName(ECS.KeyInputComponent.name);
		this.loadHighScore();
		this.drawScoreBoard();
	}

	loadHighScore() {
		try {
			const highScore = localStorage.getItem(storageKey);
			if (!highScore) {
				this.highScore = [];
			} else {
				this.highScore = JSON.parse(highScore) as HighScore;
			}
		} catch (err) {
			console.error(err);
			this.highScore = [];
		}

		// put "null" at the position of the current round, it will be filled later
		for(let i = 0; i < this.highScore.length; i++) {
			if(this.highScore[i].score <= this.props) {
				this.currentPlace = i;
				this.highScore = this.highScore.slice(0, i)
					.concat(null).concat(this.highScore.slice(i));
				break;
			} else {
				this.currentPlace++;
			}
		}
	}

	get isInputAllowed() {
		return this.currentPlace < GAME_CONFIG.maxScorePlaces && this.props !== 0;
	}

	saveHighScore() {
		const record = {
			score: this.props,
			name: this.inputName,
		};

		// we must keep the max length of the array while adding a new element
		let newScoreTable = this.highScore.slice(0, this.currentPlace).concat([record])
			.concat(this.highScore.slice(this.currentPlace + 1));
		newScoreTable = newScoreTable.slice(0, GAME_CONFIG.maxScorePlaces);

		const highScoreStr = JSON.stringify(newScoreTable);
		localStorage.setItem(storageKey, highScoreStr);
	}

	drawScoreBoard() {
		const centerX = Math.floor(this.cli.props.columns / 2);
		const centerY = Math.floor(this.cli.props.rows / 2);

		this.cli.drawBox(centerX - 18, centerY - 11, 18 * 2,
			GAME_CONFIG.maxScorePlaces * 2 + 2);
		this.cli.drawText('Highscore table', centerX - 18, centerY - 11, 'center', 18 * 2);

		for(let i = 0; i < GAME_CONFIG.maxScorePlaces; i++) {
			let name = '';
			let score = '';
			if(this.highScore.length > i && i !== this.currentPlace) {
				name = this.highScore[i].name;
				score = `${this.highScore[i].score}`;
			} else if (i === this.currentPlace) {
				score = `${this.props}`;
			}

			this.cli.drawText(`${this.pad((i+1) + '', 2, ' ')}.   ${this.pad(score, 6, score ? '0' : ' ')}    ${this.pad(name, maxNameLength, ' ', false)}`,
				centerX - 18 + 2, centerY - 11 + 2 + 2 * i, 'left');
		}
	}

	checkInput() {
		// a small hack. ECSLite doesn't expose the list of keys and we need it here
		const keys = (this.keyInput as any).keys as Set<number>;

		if (keys.size !== 0) {
			// handle first key
			const first = keys.keys().next().value;
			this.keyInput.handleKey(first);
			if (first === ECS.Keys.KEY_LEFT) {
				// move pointer to the side
				this.pointerPos = Math.max(0, this.pointerPos - 1);
			} else if (first === ECS.Keys.KEY_RIGHT) {
				if(this.inputName[this.pointerPos]) {
					this.pointerPos = Math.min(maxNameLength - 1, this.pointerPos + 1);
				}
			} else if (first === 8) {
				// backspace - remove the last letter
				if(this.pointerPos < maxNameLength - 1 || !this.inputName[maxNameLength - 1]) {
					this.inputName = this.inputName.substr(0, this.pointerPos - 1)
						.concat(this.inputName.substr(this.pointerPos));
					this.pointerPos = Math.max(0, this.pointerPos - 1);
				} else {
					this.inputName = this.inputName.substr(0, this.pointerPos)
						.concat(this.inputName.substr(this.pointerPos + 1));
				}
			} else {
				// we can put only alphabet characters
				if ('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'.indexOf(String.fromCharCode(first)) !== -1) {
					// update the current input string and move the pointer
					this.inputName = this.inputName.substr(0, this.pointerPos) +
						String.fromCharCode(first).toUpperCase() + this.inputName.substr(this.pointerPos + 1);
					this.pointerPos = Math.min(maxNameLength - 1, this.pointerPos + 1);
				}
			}
		}
	}

	renderInput(frameCounter: number) {
		const centerX = Math.floor(this.cli.props.columns / 2);
		const centerY = Math.floor(this.cli.props.rows / 2);
		this.cli.drawPattern(' ', centerX - 18 + 2 + 16,
			centerY - 11 + 2 + 2 * this.currentPlace, maxNameLength, 1);
		this.cli.drawText(this.inputName, centerX - 18 + 2 + 16,
			centerY - 11 + 2 + 2 * this.currentPlace, 'left');

		// flickering effect of the pointer
		if(this.highlightFlag) {
			const inputChar = this.inputName[this.pointerPos] || ' ';
			this.cli.enableHighlight();
			this.cli.drawText(inputChar, centerX - 18 + 2 + 16 + this.pointerPos,
				centerY - 11 + 2 + 2 * this.currentPlace);
			this.cli.disableHighlight();
		}
		if(frameCounter % 10 === 0) {
			this.highlightFlag = !this.highlightFlag;
		}
	}

	onUpdate() {
		if (this.keyInput.isKeyPressed(ECS.Keys.KEY_ENTER)) {
			// on enter, save highscore and load intro again
			if(this.inputName.length !== 0) {
				this.saveHighScore();
			}

			this.scene.callWithDelay(0, () => new Factory().loadIntro(this.scene));
			this.finish();
		} else if(this.isInputAllowed) {
			this.checkInput();
			this.renderInput(this.frameCounter++);
		}
	}

	private pad(n: string, width: number, placeholder: string, left = true) {
		if(left) {
			return n.length >= width ? n : new Array(width - n.length + 1).join(placeholder) + n;
		} else {
			return n.length >= width ? n : n + new Array(width - n.length + 1).join(placeholder);
		}
	}
}