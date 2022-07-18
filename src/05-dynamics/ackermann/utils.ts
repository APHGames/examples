import * as ECS from '../../../libs/pixi-ecs';

export const calcAbsPos = (objPosX: number, objPosY: number, objRotation: number, pointX: number, pointY: number) => {
	return new ECS.Vector(objPosX + pointY * Math.cos(-objRotation) - pointX * Math.sin(-objRotation),
		objPosY + pointY * Math.sin(-objRotation) + pointX * Math.cos(-objRotation));
};