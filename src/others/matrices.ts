import * as ECS from '../../libs/pixi-ecs';
import { ECSExample } from '../utils/APHExample';

type vec3d = {
	x: number;
	y: number;
	z: number;
}

type triangle = [vec3d, vec3d, vec3d]

type mesh = {
	tris: triangle[];
}

type mat4x4 = [[number, number, number, number], [number, number, number, number], [number, number, number, number], [number, number, number, number]]

const width = 800;
const height = 600;

const defMat4x4 = (): mat4x4 => [
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
	[0, 0, 0, 0],
];

export class Matrices extends ECSExample {

	multiplyMatrixVector(i: vec3d, m: mat4x4): vec3d {
		const output: vec3d = { x: 0, y: 0, z: 0 };
		output.x = i.x * m[0][0] + i.y * m[1][0] + i.z * m[2][0] + m[3][0];
		output.y = i.x * m[0][1] + i.y * m[1][1] + i.z * m[2][1] + m[3][1];
		output.z = i.x * m[0][2] + i.y * m[1][2] + i.z * m[2][2] + m[3][2];
		const w = i.x * m[0][3] + i.y * m[1][3] + i.z * m[2][3] + m[3][3];
		if (w !== 0) {
			output.x /= w;
			output.y /= w;
			output.z /= w;
		}
		return output;
	}

	drawTriangle(gfx: ECS.Graphics, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number) {
		gfx.lineStyle(1, 0xcdcdcd);
		gfx.moveTo(x1, y1);
		gfx.lineTo(x2, y2);
		gfx.lineTo(x3, y3);
		gfx.lineTo(x1, y1);

		gfx.moveTo(0, 0);
		gfx.lineStyle(0);
	}

	load() {
		// init the scene and run your game
		let scene = this.engine.scene;
		let fTheta = 0;
		new ECS.Builder(scene)
			.withParent(scene.stage)
			.withComponent(new ECS.FuncComponent('rotation').doOnUpdate((cmp) => {
				const gfx = cmp.owner.asGraphics();
				// clock-wise ordering
				const meshCube: mesh = {
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

				gfx.clear();

				// let's normalize our screen to a range of <-1, 1> for both axis -> [0, 0] is the middle of the screen
				const fAspect = height / width;
				// FOV -> the lower it is, the more we will zoom in and vice versa
				const fov = 90;
				const fNear = 0.1;
				const fFar = 1000;
				const fFov = 1 / Math.tan(fov * 0.5 / 180 * Math.PI);
				// the projection matrix will work for all 3D applications and is highly customizable
				const matProj = defMat4x4();
				matProj[0][0] = fAspect * fFov;
				matProj[1][1] = fFov;
				matProj[2][2] = fFar / (fFar - fNear);
				matProj[3][2] = (-fFar * fNear) / (fFar - fNear);
				matProj[2][3] = 1;
				matProj[3][3] = 0;


				const matRotZ = defMat4x4();
				const matRotX = defMat4x4();

				fTheta += 0.01;

				matRotZ[0][0] = Math.cos(fTheta);
				matRotZ[0][1] = Math.sin(fTheta);
				matRotZ[1][0] = -Math.sin(fTheta);
				matRotZ[1][1] = Math.cos(fTheta);
				matRotZ[2][2] = 1;
				matRotZ[3][3] = 1;

				matRotX[0][0] = 1;
				matRotX[1][1] = Math.cos(fTheta * 0.5);
				matRotX[1][2] = Math.sin(fTheta * 0.5);
				matRotX[2][1] = -Math.sin(fTheta * 0.5);
				matRotX[2][2] = Math.cos(fTheta * 0.5);
				matRotX[3][3] = 1;

				for (let tri of meshCube.tris) {
					let triProjected: triangle = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
					let triRotatedZ: triangle = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];
					let triRotatedZX: triangle = [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: 0 }];

					triRotatedZ[0] = this.multiplyMatrixVector(tri[0], matRotZ);
					triRotatedZ[1] = this.multiplyMatrixVector(tri[1], matRotZ);
					triRotatedZ[2] = this.multiplyMatrixVector(tri[2], matRotZ);

					triRotatedZX[0] = this.multiplyMatrixVector(triRotatedZ[0], matRotX);
					triRotatedZX[1] = this.multiplyMatrixVector(triRotatedZ[1], matRotX);
					triRotatedZX[2] = this.multiplyMatrixVector(triRotatedZ[2], matRotX);


					let triTranslated: triangle = [{ x: triRotatedZX[0].x, y: triRotatedZX[0].y, z: triRotatedZX[0].z }, { x: triRotatedZX[1].x, y: triRotatedZX[1].y, z: triRotatedZX[1].z }, { x: triRotatedZX[2].x, y: triRotatedZX[2].y, z: triRotatedZX[2].z }];

					// translate it first
					triTranslated[0].z = triRotatedZX[0].z + 3;
					triTranslated[1].z = triRotatedZX[1].z + 3;
					triTranslated[2].z = triRotatedZX[2].z + 3;



					triProjected[0] = this.multiplyMatrixVector(triTranslated[0], matProj);
					triProjected[1] = this.multiplyMatrixVector(triTranslated[1], matProj);
					triProjected[2] = this.multiplyMatrixVector(triTranslated[2], matProj);

					// shift the coordinates
					triProjected[0].x += 1;
					triProjected[0].y += 1;
					triProjected[1].x += 1;
					triProjected[1].y += 1;
					triProjected[2].x += 1;
					triProjected[2].y += 1;

					triProjected[0].x *= 0.5 * width;
					triProjected[0].y *= 0.5 * height;
					triProjected[1].x *= 0.5 * width;
					triProjected[1].y *= 0.5 * height;
					triProjected[2].x *= 0.5 * width;
					triProjected[2].y *= 0.5 * height;

					this.drawTriangle(gfx, triProjected[0].x, triProjected[0].y, triProjected[1].x, triProjected[1].y, triProjected[2].x, triProjected[2].y);
				}
			}))
			.asGraphics()
			.build();
	}

	update() {
		// no-op
	}
}
