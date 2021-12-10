/**
 * Score counter implemented according to this table:
 * https://www.codewars.com/kata/5da9af1142d7910001815d32
 */
export class ScoreCounter {
	currentScore = 0;
	level = 0;

	onTetrominoPlaced(extraScore: number) {
		this.currentScore += extraScore;
	}

	onLinesCleared(lineNum: number) {
		switch(lineNum) {
			case 1:
				this.currentScore += 40 * (this.level + 1);
				break;
			case 2:
				this.currentScore += 100 * (this.level + 1);
				break;
			case 3:
				this.currentScore += 300 * (this.level + 1);
				break;
			case 4:
				this.currentScore += 1200 * (this.level + 1);
				break;
		}
	}
}