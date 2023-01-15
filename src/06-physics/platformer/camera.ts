import * as ECS from '../../../libs/pixi-ecs';
import { SCENE_WIDTH } from './constants';

// todo this does not work properly
export const CAMERA_BORDER_X = Math.floor(SCENE_WIDTH / 3);
export const CAMERA_BORDER_Y = Math.floor(SCENE_WIDTH / 3);

export class Camera extends ECS.Component<{ container: ECS.Container }> {

	onUpdate() {
		const mapContainer = this.props.container;
		const levelWidth = this.scene.stage.width;
		const levelHeight = this.scene.stage.height;
		const player = this.owner;

		// move camera with player if he is next to the border of screen
		let relPosX = player.x + mapContainer.x;
		let relPosY = player.y + mapContainer.y;

		let diffX = 0;

		// x-axis
		if (relPosX < CAMERA_BORDER_X) {
			//move left
			diffX = CAMERA_BORDER_X - relPosX;
		} else if (relPosX + player.width > this.scene.width - CAMERA_BORDER_X) {
			//move right
			diffX = this.scene.width - CAMERA_BORDER_X - relPosX - player.width;
		}

		mapContainer.x += diffX;

		let diffY = 0;

		// y-axis
		if (relPosY < CAMERA_BORDER_Y) {
			//move down
			diffY = CAMERA_BORDER_Y - relPosY;
		} else if (relPosY + player.width > this.scene.height - CAMERA_BORDER_Y) {
			//move up
			diffY = this.scene.height - CAMERA_BORDER_Y - relPosY - player.width;
		}

		mapContainer.y += diffY;

		//edge cases
		mapContainer.x = Math.min(0, Math.max(this.scene.width - levelWidth, mapContainer.x));
		mapContainer.y = Math.min(0, Math.max(this.scene.height - levelHeight, mapContainer.y));
	}
}