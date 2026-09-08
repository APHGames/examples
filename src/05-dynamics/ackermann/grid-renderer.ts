import * as ECS from 'colfio';

export class GridRenderer extends ECS.Component {

	onUpdate() {
		const ctx = this.owner.asGraphics();
		ctx.clear();

		const stagePos = this.scene.stage.position;
		const minX = -stagePos.x;
		const maxX = -stagePos.x + this.scene.width;
		const minY = -stagePos.y;
		const maxY = -stagePos.y + this.scene.height;

		// draw background (Grid)
		const cellSize = 50;
		ctx.rect(minX - cellSize, minY - cellSize, this.scene.width + 2 * cellSize, this.scene.height + 2 * cellSize)
			.fill({ color: 0x222222 });

		// horizontal lines
		for (let y = minY - minY % cellSize; y < maxY; y += cellSize) {
			ctx.moveTo(minX, y);
			ctx.lineTo(maxX, y);
		}

		// vertical lines
		for (let x = minX - minX % cellSize; x < maxX; x += cellSize) {
			ctx.moveTo(x, minY);
			ctx.lineTo(x, maxY);
		}
		ctx.stroke({ width: 1, color: 0x888888 });
	}
}
