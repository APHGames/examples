import { ShapeData, SHAPES } from './tetrominos';

/**
 * Random generator for new shapes
 */
export class ShapeGenerator {
	shapeCounter = 0;
	shapesGenerated: Map<string, number> = new Map();

	protected permPointer: number;
	protected currentPermutation: ShapeData[];
	protected nextPermutation: ShapeData[];

	generate() {
		if (!this.currentPermutation
			|| this.permPointer === (this.currentPermutation.length - 1)) {
			this.generatePermutation();
		}
		this.permPointer++;
		this.shapeCounter++;
		this.incrementStats(this.getCurrentShape().name);
	}

	getCurrentShape(): ShapeData {
		return this.currentPermutation[this.permPointer];
	}

	getNextShape(): ShapeData {
		if (this.currentPermutation) {
			if ((this.permPointer + 1) < this.currentPermutation.length) {
				// get it from the current permutation
				return this.currentPermutation[this.permPointer + 1];
			} else {
				// get it from the next permutation (we are already at the end of the current one)
				return this.nextPermutation[0];
			}
		}
	}

	protected generatePermutation() {
		if (!this.nextPermutation) {
			this.currentPermutation = this.shuffleShapeArray();
		} else {
			this.currentPermutation = this.nextPermutation;
		}
		// random shuffle
		this.nextPermutation = this.shuffleShapeArray();
		this.permPointer = -1;
	}

	protected incrementStats(name: string) {
		if (this.shapesGenerated.has(name)) {
			this.shapesGenerated.set(name, this.shapesGenerated.get(name) + 1);
		} else {
			this.shapesGenerated.set(name, 1);
		}
	}

	protected shuffleShapeArray() {
		// sort() mutates the original array. Hence the [...] spread operator
		return [...SHAPES].sort(() => Math.random() - 0.5);
	}
}