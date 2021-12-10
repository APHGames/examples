import * as ECS from '../../../libs/pixi-ecs';
import { ShapeData, Rotation, CELL_EMPTY, Direction, CELL_PLACED, CELL_PLAYER } from './tetrominos';
import { ShapeGenerator } from './shape-generator';
import { ScoreCounter } from './score-counter';
import { GAME_CONFIG } from '../constants';

/**
 * Shape that is being controlled by the player
 */
export type MovingShape = {
	shape: ShapeData;
	rotation: Rotation;
	// position of the top-left corner of the default bounding box (without rotations)
	position: ECS.Vector;
	// offset from the position that points to the top-left corner of tetramino
	offset: [number, number];
	// if true, player's tetromino collides with another cell
	collides: boolean;
}

export class GameModel {

	readonly gameBoard: number[] = [];
	readonly rows: number;
	readonly extraRows: number;
	readonly columns: number;
	// initial level
	readonly firstLevel: number;
	// random generator for tetromino permutations
	protected generator: ShapeGenerator;
	protected scoreCounter: ScoreCounter;
	// counter for removed rows throughout the game
	protected removedRows: number;
	// current shape controlled by the player
	protected tetromino: MovingShape;
	// counter of placed shapes in the current level
	protected levelShapeCounter: number;
	protected gameOver: boolean;

	/**
	 * Initializes the model
	 * @param columns columns of the game board
	 * @param rows rows of the game board
	 * @param extraRows extra rows needed for the player to rotate once the tetromino arrives at the first visible row
	 * @param level first level
	 */
	constructor(columns: number, rows: number, extraRows: number, level: number = 0) {
		this.rows = rows;
		this.extraRows = extraRows;
		this.columns = columns;
		this.firstLevel = level;
		this.reset();
	}

	get currentLevel() {
		return this.scoreCounter.level;
	}

	get boardSize() {
		return this.columns * (this.rows + this.extraRows);
	}

	get hasTetromino() {
		return this.tetromino !== null && this.tetromino !== undefined;
	}

	get currentScore() {
		return this.scoreCounter.currentScore;
	}

	get isGameOver() {
		return this.gameOver;
	}

	getStats() {
		return {
			removedRows: this.removedRows,
			shapesGenerated: this.generator.shapesGenerated,
			nextShape: this.generator.getNextShape(),
		};
	}

	/**
	 * Returns true, if a cell at a given position is empty
	 * @param pos position to check
	 */
	isEmpty(pos: ECS.Vector) {
		return this.gameBoard[this.posToIndex(pos)] === CELL_EMPTY;
	}

	cellTypeAt(pos: ECS.Vector) {
		return this.gameBoard[this.posToIndex(pos)];
	}

	/**
	 * Resets the game board
	 */
	reset() {
		// init with empty cells
		for (let i = 0; i < this.boardSize; i++) {
			this.gameBoard[i] = CELL_EMPTY;
		}
		this.tetromino = null;
		this.gameOver = false;
		this.generator = new ShapeGenerator();
		this.scoreCounter = new ScoreCounter();
		this.scoreCounter.level = this.firstLevel;
		this.removedRows = 0;
		this.levelShapeCounter = 0;
	}

	putRandomTetromino() {
		this.generator.generate();
		const next = this.generator.getCurrentShape();
		let initPosition: ECS.Vector;
		// straight is slightly moved to the left
		if(next.name === 'STRAIGHT') {
			initPosition = new ECS.Vector(Math.floor(this.columns / 2) - 2, this.extraRows);
		} else {
			initPosition = new ECS.Vector(Math.floor(this.columns / 2) - 1, this.extraRows);
		}
		// all tetrominos are put with the same rotation
		this.putTetromino(next, Rotation.TOP, initPosition);

		// if the new shape is colliding, there is nowhere to go
		if(this.tetromino.collides) {
			this.gameOver = true;
			return;
		}

		this.levelShapeCounter++;
		if (this.levelShapeCounter > GAME_CONFIG.tetrominosPerLevel &&
			this.currentLevel < GAME_CONFIG.maxLevel) {

			this.levelShapeCounter = 0;
			this.increaseLevel();
		}
	}

	/**
	 * Applies the current tetromino, changes its value
	 * from CELL_PLAYER to CELL_PLACED
	 * and generates a new random tetromino
	 * @returns array of indices of rows that has been cleared out
	 */
	applyTetromino(extraScore: number): number[] {
		if(!this.tetromino || this.tetromino.collides) {
			throw new Error('Player is in a wrong state.');
		}
		if (this.canMoveTetromino(Direction.DOWN)) {
			throw new Error('Player can still go down!');
		}

		const indices = this.calcTetrominoIndices();

		for(let index of indices) {
			this.gameBoard[index] = CELL_PLACED;
		}

		this.scoreCounter.onTetrominoPlaced(extraScore);
		this.tetromino = null;

		const rowsToRemove = this.findFullRows();
		if (rowsToRemove.length) {
			this.removeRows(rowsToRemove);
		}
		this.putRandomTetromino();
		return rowsToRemove;
	}

	/**
	 * Returns rows that can be removed. **Doesn't consider extra rows**
	 * Should be called after 'applyMovingShape()'
	 */
	findFullRows(): number[] {
		const output = [];

		for (let i = (this.extraRows); i < (this.rows + this.extraRows); i++) {
			let colCounter = 0;
			// once every column contains non-empty cell, we have a row that can be removed
			for (let j = 0; j < this.columns; j++) {
				if (this.cellTypeAt(new ECS.Vector(j, i)) === CELL_PLACED) {
					colCounter++;
				}
			}
			if (colCounter === this.columns) {
				// extra rows aren't considered!!!
				output.push(i - this.extraRows);
			}
		}
		return output;
	}

	/**
	 * Removes passed rows, not including the extra rows!
	 * The rows must be sorted in a descending order
	 */
	removeRows(rows: number[]) {
		for(let rowIndex of rows) {
			for(let i = rowIndex - 1; i >= 0; i--) {
				for(let j = 0; j < this.columns; j++) {
					const above = this.posToIndex(new ECS.Vector(j, i + this.extraRows));
					const below = this.posToIndex(new ECS.Vector(j, i + 1 + this.extraRows));
					this.gameBoard[below] = this.gameBoard[above];
				}
			}
			this.removedRows++;
		}
		this.scoreCounter.onLinesCleared(rows.length);
	}

	/**
	 * Returns true, if the tetromino can follow a given direction
	 */
	canMoveTetromino(direction: Direction): boolean {
		if(this.tetromino.collides) {
			return false;
		}
		const indices = this.calcTetrominoIndices();

		for (let index of indices) {
			switch (direction) {
				case Direction.DOWN:
					if ((index + this.columns) >= this.boardSize
						|| this.gameBoard[index + this.columns] === CELL_PLACED) {
						return false;
					}
					break;
				case Direction.LEFT:
					if (index % this.columns === 0
						|| this.gameBoard[index - 1] === CELL_PLACED) {
						return false;
					}
					break;
				case Direction.RIGHT:
					if (index % this.columns === (this.columns - 1)
					|| this.gameBoard[index + 1] === CELL_PLACED) {
						return false;
					}
					break;
			}
		}
		return true;
	}

	/**
	 * Moves tetromino along the given direction
	 */
	moveTetromino(direction: Direction) {
		if (!this.canMoveTetromino(direction)) {
			throw new Error('Tetromino can\'t go this way!');
		}

		const currentIndices = this.calcTetrominoIndices();
		switch(direction) {
			case Direction.DOWN:
				this.tetromino.position = this.tetromino.position.add(new ECS.Vector(0, 1));
				break;
			case Direction.LEFT:
				this.tetromino.position = this.tetromino.position.add(new ECS.Vector(-1, 0));
				break;
			case Direction.RIGHT:
				this.tetromino.position = this.tetromino.position.add(new ECS.Vector(1, 0));
				break;
		}

		// calc new indices and swap cell states
		const newIndices = this.calcTetrominoIndices();

		// we need to do it twice - first, remove all player indices
		// and put them again with updated positions
		for(let index of currentIndices) {
			this.gameBoard[index] = CELL_EMPTY;
		}
		for(let index of newIndices) {
			this.gameBoard[index] = CELL_PLAYER;
		}
	}

	/**
	 * Returns true if given rotation can be applied
	 * @param direction rotation direction
	 * @returns
	 */
	canRotate(direction: Direction) {
		if(this.tetromino.collides) {
			return false;
		}
		const newRotation = this.directionToNewRotation(direction);
		const rotationData = this.calcRotationData(this.tetromino.shape.data, newRotation);
		const rotationOffset = this.getRotationDiffOffset(newRotation);
		const tetrominoPosition = this.tetromino.position.add(
			new ECS.Vector(rotationOffset[0], rotationOffset[1]));

		for (let i = 0; i < rotationData.length; i++) {
			for (let j = 0; j < rotationData[i].length; j++) {
				if (rotationData[i][j] === 1) {
					// occupied cell -> check if we can put it to the board
					const boardCoordX = tetrominoPosition.x + j;
					const boardCoordY = tetrominoPosition.y + i;
					const idx = this.posToIndex(new ECS.Vector(boardCoordX, boardCoordY));

					if (this.gameBoard[idx] === CELL_PLACED ||
						boardCoordX < 0 || boardCoordY < 0
							|| boardCoordX >= this.columns || boardCoordY >= this.rows) {
						return false;
					}
				}
			}
		}
		return true;
	}


	/**
	 * Applies a rotation
	 * @param direction direction to apply
	 */
	rotate(direction: Direction) {
		if(!this.canRotate(direction)) {
			throw new Error('Rotation can\'t be applied!');
		}

		const newRotation = this.directionToNewRotation(direction);
		const { shape, position } = this.tetromino;

		// remove the shape and put it again with updated rotation index
		this.removeTetromino();
		this.putTetromino(shape, newRotation, position);
	}

	/**
	 * Removes the tetromino and replaces it with empty cells
	 */
	protected removeTetromino() {
		if(!this.tetromino) {
			throw new Error('There is no tetromino to remove!');
		}
		const currentIndices = this.calcTetrominoIndices();
		// remove tetromino indices and put them again
		for (let idx of currentIndices) {
			this.gameBoard[idx] = CELL_EMPTY;
		}
		this.tetromino = null;
	}

	protected increaseLevel() {
		this.scoreCounter.level++;
	}

	/**
	 * Calculates offset of which the rotated tetromino will be shifted
	 */
	protected getRotationDiffOffset(rotation: Rotation): [number, number] {
		let offset: [number, number];
		switch(rotation) {
			case Rotation.TOP:
				offset = null;
				break;
			case Rotation.RIGHT:
				offset = this.tetromino.shape.offsetRight;
				break;
			case Rotation.BOTTOM:
				offset = this.tetromino.shape.offsetBottom;
				break;
			case Rotation.LEFT:
				offset = this.tetromino.shape.offsetLeft;
				break;
		}

		return offset || [0, 0];
	}

	/**
	 * Inserts a new tetromino
	 * @param shape shape to insert
	 * @param rotation rotation of the shape
	 * @param position top-left position of the tetromino (first occupied block)
	 * Keep in mind that the final position will also consider the rotation offsets
	 */
	protected putTetromino(shape: ShapeData, rotation: Rotation, position: ECS.Vector) {
		if(this.tetromino) {
			throw new Error('There already is a tetromino. You need to remove it first');
		}
		this.tetromino = {
			...this.tetromino,
			shape,
			rotation,
			position,
			offset: null, // will be re-declared below
		};

		// offset needs to be stored separately from player position, since
		// it changes based on the current rotation, but the rotation itself
		// doesn't afect the position of the player, even if the tetramino is shifted
		const offset = this.getRotationDiffOffset(rotation);
		this.tetromino.offset = offset;

		const shapeData = this.calcRotationData(shape.data, rotation);

		for (let i = 0; i < shapeData.length; i++) {
			for (let j = 0; j < shapeData[i].length; j++) {
				if (shapeData[i][j] === 1) {
					const boardCoordX = j + position.x + offset[0];
					const boardCoordY = i + position.y + offset[1];
					const idx = this.posToIndex(new ECS.Vector(boardCoordX, boardCoordY));

					if(this.gameBoard[idx] === CELL_PLACED) {
						// there already is a placed cell -> GAME OVER
						this.tetromino.collides = true;
					}

					this.gameBoard[idx] = CELL_PLAYER;
				}
			}
		}
	}

	/**
	 * Calculates exact indices of the tetromino in the game board, according
	 * to the position of the tetromino and shape data
	 */
	private calcTetrominoIndices() {
		const playerRotationData = this.calcRotationData(this.tetromino.shape.data, this.tetromino.rotation);
		const output: number[] = [];
		// just a reminder: player shape data contains tetromino in a format like this:
		// [1,0,0]
		// [1,1,1]
		// hence, if the player's position if [5, 7], the position of the first occupied cell is
		// also [5 ,7], but the next two cells on the same row are empty
		for (let i = 0; i < playerRotationData.length; i++) {
			for (let j = 0; j < playerRotationData[i].length; j++) {
				if (playerRotationData[i][j] === 1) {
					const boardVec = new ECS.Vector(j + this.tetromino.position.x + this.tetromino.offset[0],
						i + this.tetromino.position.y + this.tetromino.offset[1]);
					const boardPos = this.posToIndex(boardVec);
					output.push(boardPos);
				}
			}
		}
		return output;
	}

	private posToIndex(pos: ECS.Vector) {
		return this.columns * pos.y + pos.x;
	}

	private directionToNewRotation(dir: Direction) {
		switch(this.tetromino.rotation) {
			case Rotation.TOP:
				return dir === Direction.LEFT ? Rotation.LEFT : Rotation.RIGHT;
			case Rotation.RIGHT:
				return dir === Direction.LEFT ? Rotation.TOP : Rotation.BOTTOM;
			case Rotation.BOTTOM:
				return dir === Direction.LEFT ? Rotation.RIGHT : Rotation.LEFT;
			case Rotation.LEFT:
				return dir === Direction.LEFT ? Rotation.BOTTOM : Rotation.TOP;
		}
	}

	/**
	 * Builds data array for a given rotation
	 * Doesn't calculate rotation offsets!
	 * @param data data of the default rotation
	 * @param rotation next rotation
	 */
	private calcRotationData(data: number[][], rotation: Rotation): number[][] {
		let rotationsNum = 0;
		switch(rotation) {
			case Rotation.TOP:
				rotationsNum = 0;
				// no rotation
				return data;
			case Rotation.RIGHT:
				rotationsNum = 3;
				break;
			case Rotation.BOTTOM:
				rotationsNum = 2;
				break;
			case Rotation.LEFT:
				rotationsNum = 1;
				break;
		}

		// 2D array transposition function
		const leftTranspose = (matrix) => matrix[0].map((row, i) =>
			matrix.map(row => row[row.length - i - 1]));

		// rotating from the left
		for(let i = 0; i < rotationsNum; i++) {
			data = leftTranspose(data);
		}

		return data;
	}
}