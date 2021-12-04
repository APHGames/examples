import * as ECS from '../../libs/pixi-ecs';
import { ECSExample } from '../utils/APHExample';


type Vector3 = {
	x: number;
	y: number;
	z: number;
}

type Triangle3 = [Vector3, Vector3, Vector3];

type Mesh = {
	tris: Triangle3[];
}

type Matrix4x4 = [
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number],
	[number, number, number, number]
]

// 3D scene size
const WIDTH = 800;
const HEIGHT = 600;

const makeIdentity = (): Matrix4x4 => [
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
];

const makeProjection = (aspect: number, fov: number, near: number, far: number): Matrix4x4 => {
	const fovTan = 1 / Math.tan(fov * 0.5);

	const matProj = makeIdentity();
	matProj[0][0] = aspect * fovTan;
	matProj[1][1] = fovTan;
	matProj[2][2] = far / (far - near);
	matProj[3][2] = (-far * near) / (far - near);
	matProj[2][3] = 1;
	matProj[3][3] = 0;
	return matProj;
};

const makeRotX = (theta: number): Matrix4x4 => {
	const matRotX = makeIdentity();
	matRotX[0][0] = 1;
	matRotX[1][1] = Math.cos(theta * 0.5);
	matRotX[1][2] = Math.sin(theta * 0.5);
	matRotX[2][1] = -Math.sin(theta * 0.5);
	matRotX[2][2] = Math.cos(theta * 0.5);
	matRotX[3][3] = 1;
	return matRotX;
};

const makeRotZ = (theta: number): Matrix4x4 => {
	const matRotZ = makeIdentity();
	matRotZ[0][0] = Math.cos(theta);
	matRotZ[0][1] = Math.sin(theta);
	matRotZ[1][0] = -Math.sin(theta);
	matRotZ[1][1] = Math.cos(theta);
	matRotZ[2][2] = 1;
	matRotZ[3][3] = 1;
	return matRotZ;
};

const makeCube = (): Mesh => {
	return {
		tris: [
			// south
			[{ x: 0, y: 0, z: 0 }, { x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 0 }],
			[{ x: 0, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 0, z: 0 }],

			// east
			[{ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }],
			[{ x: 1, y: 0, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 1, y: 0, z: 1 }],

			// north
			[{ x: 1, y: 0, z: 1 }, { x: 1, y: 1, z: 1 }, { x: 0, y: 1, z: 1 }],
			[{ x: 1, y: 0, z: 1 }, { x: 0, y: 1, z: 1 }, { x: 0, y: 0, z: 1 }],

			// west
			[{ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 1 }, { x: 0, y: 1, z: 0 }],
			[{ x: 0, y: 0, z: 1 }, { x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 0 }],

			// top
			[{ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 1 }, { x: 1, y: 1, z: 1 }],
			[{ x: 0, y: 1, z: 0 }, { x: 1, y: 1, z: 1 }, { x: 1, y: 1, z: 0 }],

			// bottom
			[{ x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }],
			[{ x: 1, y: 0, z: 1 }, { x: 0, y: 0, z: 0 }, { x: 1, y: 0, z: 0 }],
		]
	};
};

const multiplyMatrixVector = (i: Vector3, m: Matrix4x4): Vector3 => {
	const output: Vector3 = { x: 0, y: 0, z: 0 };
	output.x = i.x * m[0][0] + i.y * m[1][0] + i.z * m[2][0] + m[3][0];
	output.y = i.x * m[0][1] + i.y * m[1][1] + i.z * m[2][1] + m[3][1];
	output.z = i.x * m[0][2] + i.y * m[1][2] + i.z * m[2][2] + m[3][2];
	// perspective distortion
	const w = i.x * m[0][3] + i.y * m[1][3] + i.z * m[2][3] + m[3][3];

	if (w !== 0) {
		output.x /= w;
		output.y /= w;
		output.z /= w;
	}
	return output;
};

const multiplyMatrixTriangle = (i: Triangle3, m: Matrix4x4): Triangle3 => {
	const newTri: Triangle3 = [multiplyMatrixVector(i[0], m), multiplyMatrixVector(i[1], m), multiplyMatrixVector(i[2], m)];
	return newTri;
};


export class Matrices extends ECSExample {


	drawTriangle(gfx: ECS.Graphics, triangle: Triangle3) {
		gfx.lineStyle(1, 0xcdcdcd);
		gfx.moveTo(triangle[0].x, triangle[0].y);
		gfx.lineTo(triangle[1].x, triangle[1].y);
		gfx.lineTo(triangle[2].x, triangle[2].y);
		gfx.lineTo(triangle[0].x, triangle[0].y);
		gfx.moveTo(0, 0);
		gfx.lineStyle(0);
	}

	load() {
		let scene = this.engine.scene;
		// let's normalize our screen to a range of <-1, 1> for both axis -> [0, 0] is the middle of the screen
		const fAspect = HEIGHT / WIDTH;
		// FOV -> the lower it is, the more we will zoom in and vice versa
		const fov = 90;
		const fovRad = fov / 180 * Math.PI;
		const fNear = 0.1;
		const fFar = 1000;

		let theta = 0;

		new ECS.Builder(scene)
			.withParent(scene.stage)
			.withComponent(new ECS.FuncComponent('rotation').doOnUpdate((cmp) => {
				const gfx = cmp.owner.asGraphics();
				const meshCube = makeCube();
				gfx.clear();

				const matProj = makeProjection(fAspect, fovRad, fNear, fFar);
				const matRotZ = makeRotZ(theta);
				const matRotX = makeRotX(theta + 0.5);

				theta += 0.1;

				for (let tri of meshCube.tris) {

					let triTransformed = multiplyMatrixTriangle(tri, matRotZ);
					triTransformed = multiplyMatrixTriangle(triTransformed, matRotX);
					// translate it first
					triTransformed[0].z += 3;
					triTransformed[1].z += 3;
					triTransformed[2].z += 3;
					// calculate projection
					triTransformed = multiplyMatrixTriangle(triTransformed, matProj);

					// scale and move each triangle the center of the screen
					triTransformed[0].x += 1;
					triTransformed[0].y += 1;
					triTransformed[1].x += 1;
					triTransformed[1].y += 1;
					triTransformed[2].x += 1;
					triTransformed[2].y += 1;

					triTransformed[0].x *= 0.5 * WIDTH;
					triTransformed[0].y *= 0.5 * HEIGHT;
					triTransformed[1].x *= 0.5 * WIDTH;
					triTransformed[1].y *= 0.5 * HEIGHT;
					triTransformed[2].x *= 0.5 * WIDTH;
					triTransformed[2].y *= 0.5 * HEIGHT;

					this.drawTriangle(gfx, triTransformed);
				}
			}))
			.asGraphics()
			.build();
	}
}
