import * as ECS from '../../../libs/pixi-ecs';
import { MapGrid } from './structs/map-grid';
import { Coord, makeCoord } from './structs/coord';

export type RenderData = {
	map: MapGrid;
	contextNodes?: Coord[];
	currentNode?: Coord;
	backtrace?: Map<number, number>;
	milestones?: Coord[];
}

export class GFXRenderer extends ECS.Component {

	private coords: ECS.Container[] = [];
	private cityNums: ECS.Container[] = [];
	private backtraces: Map<number, ECS.Container> = new Map();

	public renderData(data?: RenderData) {
		if (!data) {
			return;
		}

		const ctx = this.owner.asGraphics();
		ctx.clear();

		const displayDetails = data.map.width <= 20 && data.map.height <= 20;

		const blockSize = Math.min(this.scene.width / data.map.width, this.scene.height / data.map.height);

		const createCordTexts = this.coords.length === 0;
		const createCityNumsTexts = this.coords.length === 0;

		let cityIndexCnt = 0;
		// go from left to right, from top to bottom
		for (let j = 0; j < data.map.height; j++) {
			for (let i = 0; i < data.map.width; i++) {
				const coord = makeCoord(i, j);
				const tile = data.map.getTile(coord);
				switch (tile?.type) {
					case 'UNKNOWN':
						ctx.beginFill(0x000000);
						break;
					case 'ROAD':
						ctx.beginFill(0x229922, 0x66 / 0xFF);
						break;
					case 'WALL':
						ctx.beginFill(0x555555, 0x66 / 0xFF);
						break;
					case 'CITY':
						ctx.beginFill(0xfafc48, 0x88 / 0xFF);
						break;
					default:
						// if undefined, it's treated like unknown
						ctx.beginFill(0x000000, 0x66 / 0xFF);
						break;
				}

				// render cell
				ctx.drawRect(i * blockSize, j * blockSize, blockSize - 1, blockSize - 1);
				ctx.endFill();
				// render coordinates (only for small maps)
				if (displayDetails && createCordTexts) {
					const txt = new ECS.Text();
					this.coords.push(txt);
					txt.style = {
						fontSize: blockSize * 0.25,
						fontFamily: 'Courier New',
						fill: '#FFFFFF55'
					};
					txt.position.set(i * blockSize + blockSize * 0.10 - ((i >= 10 || j >= 10) ? blockSize * 0.1 : 0), j * blockSize + blockSize * 0.55);
					txt.text = `[${i},${j}]`;
					ctx.addChild(txt);
				}

				// render city number
				if(displayDetails && tile?.type === 'CITY' && createCityNumsTexts) {
					const txt = new ECS.Text();
					this.cityNums.push(txt);
					txt.style = {
						fontSize: blockSize * 0.25,
						fontFamily: 'Courier New',
						fill: '#f2ecc3'
					};
					txt.position.set(i * blockSize + blockSize * 0.40, j * blockSize + blockSize * 0.25);
					txt.text = `${cityIndexCnt + 1}`;
					ctx.addChild(txt);

					cityIndexCnt++;
				}
			}
		}

		// current node is a circle
		if(data.currentNode) {
			ctx.beginFill(0xFFFFFF);
			ctx.drawCircle(data.currentNode.x * blockSize + blockSize / 2, data.currentNode.y * blockSize + blockSize / 2, blockSize / 6);
			ctx.endFill();
		}

		// context nodes are somewhat interesting nodes that should be highlighted
		if(data.contextNodes) {
			ctx.beginFill(0xEFEFEF);
			for(let highlight of data.contextNodes) {
				ctx.drawRect(highlight.x * blockSize, highlight.y * blockSize, blockSize - 1, blockSize - 1);
			}
			ctx.endFill();
		}

		if (displayDetails && data.backtrace) {
			const allBtKeys = new Set(data.backtrace.keys());
			for(let coord of this.backtraces.keys()) {
				if(!allBtKeys.has(coord)) {
					this.backtraces.get(coord).destroy();
					this.backtraces.delete(coord);
				}
			}

			for (let index of data.backtrace.keys()) {
				const fromCoord = data.map.indexToCoord(index);
				const toCoord = data.map.indexToCoord(data.backtrace.get(index));
				const isLeft = toCoord.x === fromCoord.x - 1;
				const isRight = toCoord.x === fromCoord.x + 1;
				const isTop = toCoord.y === fromCoord.y - 1;
				const isBottom = toCoord.y === fromCoord.y + 1;
				const symbol = isLeft ? '←' : isRight ? '→' : isTop ? '↑' : isBottom ? '↓' : '';

				// we must recycle all text objects for the sake of rendering speed
				if(this.backtraces.has(index)) {
					this.backtraces.get(index).asText().text = symbol;
				} else {
					const txt = new ECS.Text();
					this.backtraces.set(index, txt);
					txt.style = {
						fontSize: Math.floor(blockSize * 0.5),
						fontFamily: 'Courier New',
						fill: '#FFFF00'
					};
					txt.position.set(fromCoord.x * blockSize + blockSize * 0.35, fromCoord.y * blockSize + blockSize * 0.85);
					txt.text = symbol;
					ctx.addChild(txt);

				}
			}
		}

		if (data.milestones) {
			ctx.beginFill(0xADADAD);
			for (let milestone of data.milestones) {
				ctx.drawRect(milestone.x * blockSize, milestone.y * blockSize, blockSize * 0.15, blockSize * 0.15);
			}
			ctx.endFill();
		}
	}
}