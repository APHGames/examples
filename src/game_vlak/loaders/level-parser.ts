import { LEVEL_COLUMNS } from '../constants';
import { Direction, LevelData, MapObject, ObjectTypes } from '../model/game-structs';

/**
 * Level parsers that reads data from .txt file and loads all levels
 */
export default class LevelParser {

	parseLevels(data: string): LevelData[] {

		const output: LevelData[] = [];
		const lines = data.split('\n').filter(line => line !== '' && line.indexOf('#') === -1);

		let currentLevel: {
			name: string;
			trainInitPos: { column: number; row: number; direction: Direction };
			bricks: MapObject[];
		} = null;
		let indexCounter = 0;

		lines.forEach(line => {
			if (line.startsWith(':')) {
				if (currentLevel) {
					// add the previous level
					output.push({ name: currentLevel.name, allObjects: currentLevel.bricks, trainInitPos: currentLevel.trainInitPos });
				}
				indexCounter = 0;
				currentLevel = { name: line.substr(1), bricks: [], trainInitPos: {column: 0, row: 0, direction: 'r'} };
				return;
			}

			for (let character of line) {
				const block = this.parseCharacter(character);
				if(block !== undefined) {
					const column = indexCounter % LEVEL_COLUMNS;
					const row = Math.floor(indexCounter / LEVEL_COLUMNS);
					currentLevel.bricks[indexCounter++] = new MapObject(block, column, row);
					if(character === 'V') {
						// initial position of the train
						currentLevel.trainInitPos = { column, row, direction: 'r' };
					}
				}
			}
		});

		if (currentLevel) {
			output.push({ name: currentLevel.name, allObjects: currentLevel.bricks, trainInitPos: currentLevel.trainInitPos });
		}

		return output;
	}

	private parseCharacter(character): ObjectTypes {
		switch (character) {
			case '0':
				return ObjectTypes.EMPTY;
			case '1':
				return ObjectTypes.WALL;
			case '2':
				return ObjectTypes.DOOR;
			case 'A':
				return ObjectTypes.DIAMOND;
			case 'B':
				return ObjectTypes.CROWN;
			case 'C':
				return ObjectTypes.TREE;
			case 'D':
				return ObjectTypes.APPLE;
			case 'E':
				return ObjectTypes.COW;
			case 'F':
				return ObjectTypes.CHERRY;
			case 'G':
				return ObjectTypes.POND;
			case 'H':
				return ObjectTypes.GIRAFFE;
			case 'I':
				return ObjectTypes.ICECREAM;
			case 'J':
				return ObjectTypes.CAKE;
			case 'K':
				return ObjectTypes.PC;
			case 'L':
				return ObjectTypes.CAR;
			case 'M':
				return ObjectTypes.BALOON;
			case 'N':
				return ObjectTypes.CLOCK;
			case 'O':
				return ObjectTypes.ELEPHANT;
			case 'P':
				return ObjectTypes.DRINK;
			case 'Q':
				return ObjectTypes.MONEY;
			case 'R':
				return ObjectTypes.PLANE;
			case 'S':
				return ObjectTypes.LEMMING;
			case 'V': // for the train
				return ObjectTypes.EMPTY;
			default:
				return undefined;
		}
	}
}