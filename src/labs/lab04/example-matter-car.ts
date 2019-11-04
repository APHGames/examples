import { MatterBase } from './example-matter-base';
import * as Matter from 'matter-js';

export class ExampleMatterCar extends MatterBase {

  protected initMatter() {
    // add bodies
    Matter.World.add(this.mWorld, [
      // walls
      Matter.Bodies.rectangle(400, 0, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(400, 600, 800, 50, { isStatic: true }),
      Matter.Bodies.rectangle(800, 300, 50, 600, { isStatic: true }),
      Matter.Bodies.rectangle(0, 300, 50, 600, { isStatic: true })
    ]);

    let scale = 0.9;
    Matter.World.add(this.mWorld, Matter.Composites.car(150, 100, 150 * scale, 30 * scale, 30 * scale));

    scale = 0.8;
    Matter.World.add(this.mWorld, Matter.Composites.car(350, 300, 150 * scale, 30 * scale, 30 * scale));

    Matter.World.add(this.mWorld, [
      Matter.Bodies.rectangle(200, 150, 400, 20, { isStatic: true, angle: Math.PI * 0.06 }),
      Matter.Bodies.rectangle(500, 350, 650, 20, { isStatic: true, angle: -Math.PI * 0.06 }),
      Matter.Bodies.rectangle(300, 560, 600, 20, { isStatic: true, angle: Math.PI * 0.04 })
    ]);
  }
}

new ExampleMatterCar(<HTMLCanvasElement>document.getElementById('gameCanvas'),);