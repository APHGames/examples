import  * as ECSA from 'colfio';
import { Attributes, GameState } from '../constants';
import BaseComponent from './base-component';
import SpriteAnimator from './sprite-animator';
import SpriteData from '../sprite-data';
import { checkTime } from '../utils/functions';


export default class SpiderSpawner extends BaseComponent {

  private lastSpawn: number = 0;
  private spawnFrequency: number;
  private maxSpawnFrequency: number;
  private isSpawning = false;

  // number of spawns per minute
  constructor(spawnFrequency: number) {
    super();
    this.spawnFrequency = spawnFrequency;
    this.maxSpawnFrequency = spawnFrequency;
  }

  onInit() {
    super.onInit();
    this.lastSpawn = 0;
    this.factory = this.owner.scene.getGlobalAttribute(Attributes.FACTORY);
  }


  onUpdate(delta: number, absolute: number) {
    if(this.lastSpawn === 0) {
      this.lastSpawn = absolute;
    }

    if(this.model.spiders.size <= 10 && checkTime(this.lastSpawn, absolute, this.spawnFrequency/60)) {
      if(!this.isSpawning && (this.model.state === GameState.DEFAULT || this.model.state === GameState.RUSH_MODE)) {
        this.isSpawning = true;
        this.lastSpawn = absolute;
        this.spawnFrequency = this.maxSpawnFrequency / 2 + Math.random() * this.maxSpawnFrequency / 2;

        let spriteData = this.owner.getAttribute<SpriteData>(Attributes.SPRITE_DATA);

        // spawn a spider
        this.owner.addComponentAndRun(new ECSA.ChainComponent()
        .waitFor(new SpriteAnimator(spriteData, spriteData.frames * (500 / this.model.gameSpeed), false, false)) // open gate
        .call(() => this.factory.spawnSpider(this.scene, this.model)) // spawn spider
        .waitTime(2000) // TODO wait until those two blocks are occupied
        .waitFor(new SpriteAnimator(spriteData, spriteData.frames * (500 / this.model.gameSpeed), false, true)) // close the gate
        .call(() => this.isSpawning = false)
        );
      }
    }
  }
}