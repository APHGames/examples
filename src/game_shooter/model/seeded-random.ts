/**
 * Deterministic pseudo-random number generator using a linear congruential
 * generator (LCG). Produces identical sequences for identical seeds, enabling
 * reproducible simulations.
 */
export class SeededRandom {
	private seed: number;

	constructor(seed: number) {
		// Ensure seed is in a valid unsigned 32-bit range
		this.seed = (seed >>> 0);
	}

	/** Returns the current seed value (useful for snapshotting state). */
	getSeed(): number {
		return this.seed;
	}

	/** Advance the generator and return the next float in [0, 1). */
	next(): number {
		// Numerical Recipes LCG parameters
		this.seed = ((this.seed * 1664525 + 1013904223) >>> 0);
		return this.seed / 0x100000000;
	}

	/** Returns a float in [min, max). */
	nextRange(min: number, max: number): number {
		return min + this.next() * (max - min);
	}

	/** Returns an integer in [min, max] (inclusive). */
	nextInt(min: number, max: number): number {
		return Math.floor(this.nextRange(min, max + 1 - Number.EPSILON));
	}

	/** Picks a random element from an array. */
	pick<T>(arr: T[]): T {
		return arr[this.nextInt(0, arr.length - 1)];
	}

	/** Returns a unit vector at a random angle. */
	randomDirection(): { x: number; y: number } {
		const angle = this.next() * Math.PI * 2;
		return { x: Math.cos(angle), y: Math.sin(angle) };
	}

	/** Clone the RNG state for deterministic branching. */
	clone(): SeededRandom {
		return new SeededRandom(this.seed);
	}
}
