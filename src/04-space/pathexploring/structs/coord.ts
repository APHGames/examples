/**
 * 2D map Coordinate
 */
export type Coord = {
	x: number;
	y: number;
};

// helper for better readability
export const makeCoord = (x: number, y: number): Coord => {
	return {
		x,
		y
	};
};

export const coordEq = (a: Coord, b: Coord) => {
	return a.x === b.x && a.y === b.y;
};

export const coordLeft = (coord: Coord): Coord => {
	return {
		x: coord.x - 1,
		y: coord.y
	};
};

export const coordRight = (coord: Coord) => {
	return {
		x: coord.x + 1,
		y: coord.y
	};
};

export const coordTop = (coord: Coord) => {
	return {
		x: coord.x,
		y: coord.y - 1
	};
};

export const coordBottom = (coord: Coord) => {
	return {
		x: coord.x,
		y: coord.y + 1
	};
};

export const coordTopLeft = (coord: Coord) => {
	return {
		x: coord.x - 1,
		y: coord.y - 1
	};
};

export const coordTopRight = (coord: Coord) => {
	return {
		x: coord.x + 1,
		y: coord.y - 1
	};
};

export const coordBottomLeft = (coord: Coord) => {
	return {
		x: coord.x - 1,
		y: coord.y + 1
	};
};

export const coordBottomRight = (coord: Coord) => {
	return {
		x: coord.x + 1,
		y: coord.y + 1
	};
};

/**
 * Returns true if they the parameters are neighbours (does not include diagonals)
 */
export const isDirectionalNeighbor = (a: Coord, b: Coord) => {
	const distX = Math.abs(a.x - b.x);
	const distY = Math.abs(a.y - b.y);
	return distX <= 1 && distY <= 1 && distX !== distY;
};

/**
 * Calculates Manhattan distance
 */
export const manhattanDist = (a: Coord, b: Coord) => {
	return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
};