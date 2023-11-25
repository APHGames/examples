import {
	Coord,
	makeCoord,
	coordLeft,
	coordRight,
	coordTop,
	coordBottom,
	coordTopLeft,
	coordTopRight,
	coordBottomLeft,
	coordBottomRight
} from './coord';
import { MapTile, TileType } from './map-tile';


export type Neighbor = 'left' | 'right' | 'top' | 'bottom' | 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight';


/**
 * 2D map structure
 */
export class MapGrid {
	mapArray: MapTile[] = [];
	width: number;
	height: number;

	constructor(width: number, height: number) {
		this.width = width;
		this.height = height;
	}

	coordToIndex = (coord: Coord): number => {
		const { x, y } = coord;
		if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
			throw new Error(`Coordinate [${coord.x},${coord.y}] outside the boundaries!`);
		}
		return y * this.width + x;
	}

	indexToCoord = (x: number): Coord => {
		return makeCoord(x % this.width, Math.floor(x / this.width));
	}

	isInsideMap = (coord: Coord) => {
		return coord.x >= 0 && coord.y >= 0 && coord.x < this.width && coord.y < this.height;
	}

	getTile(coord: Coord) {
		if (!this.isInsideMap(coord)) {
			return null;
		}
		return this.mapArray[this.coordToIndex(coord)];
	}

	setTile(coord: Coord, type: TileType) {
		this.mapArray[this.coordToIndex(coord)] = new MapTile(coord, type);
	}

	generateNeighbors() {
		for (let tile of this.mapArray) {
			// this structure is not actually needed
			tile.neighbors = {
				left: this.getTile(coordLeft(tile.coord)),
				right: this.getTile(coordRight(tile.coord)),
				top: this.getTile(coordTop(tile.coord)),
				bottom: this.getTile(coordBottom(tile.coord)),
				topLeft: this.getTile(coordTopLeft(tile.coord)),
				topRight: this.getTile(coordTopRight(tile.coord)),
				bottomLeft: this.getTile(coordBottomLeft(tile.coord)),
				bottomRight: this.getTile(coordBottomRight(tile.coord)),
			};
			// this order is very important. If it's different, the DFS algorithm would behave differently
			tile.directionalNeighbors = [tile.neighbors.top, tile.neighbors.left, tile.neighbors.bottom, tile.neighbors.right];

			tile.neighborsArr = [tile.neighbors.top, tile.neighbors.left, tile.neighbors.bottom, tile.neighbors.right,
				tile.neighbors.topLeft, tile.neighbors.topRight, tile.neighbors.bottomLeft, tile.neighbors.bottomRight];
		}
	}
}