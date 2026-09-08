import * as ECS from 'colfio';
import { SCENE_WIDTH } from './constants';

export const CAMERA_BORDER_X = Math.floor(SCENE_WIDTH / 3);
export const CAMERA_BORDER_Y = Math.floor(SCENE_WIDTH / 3);

/**
 * Keeps the player near the center of the view by scrolling the map layer.
 * Clamps against the tile map size (not sprite local bounds — the background
 * image is larger than the level and would allow bogus vertical scroll).
 */
export class Camera extends ECS.Component<{
	container: ECS.Container;
	levelWidth: number;
	levelHeight: number;
}> {

	onUpdate() {
		const mapContainer = this.props.container;
		const viewW = this.scene.width;
		const viewH = this.scene.height;
		const levelWidth = this.props.levelWidth;
		const levelHeight = this.props.levelHeight;
		const player = this.owner;

		let relPosX = player.x + mapContainer.x;
		let relPosY = player.y + mapContainer.y;

		let diffX = 0;
		if (relPosX < CAMERA_BORDER_X) {
			diffX = CAMERA_BORDER_X - relPosX;
		} else if (relPosX + 1 > viewW - CAMERA_BORDER_X) {
			diffX = viewW - CAMERA_BORDER_X - relPosX - 1;
		}
		mapContainer.x += diffX;

		let diffY = 0;
		if (relPosY < CAMERA_BORDER_Y) {
			diffY = CAMERA_BORDER_Y - relPosY;
		} else if (relPosY + 1 > viewH - CAMERA_BORDER_Y) {
			diffY = viewH - CAMERA_BORDER_Y - relPosY - 1;
		}
		mapContainer.y += diffY;

		// Keep the map from scrolling past its edges (locks at 0 if the level fits in view)
		mapContainer.x = Math.min(0, Math.max(viewW - levelWidth, mapContainer.x));
		mapContainer.y = Math.min(0, Math.max(viewH - levelHeight, mapContainer.y));
	}
}
