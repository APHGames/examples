import * as ECSA from 'colfio';
import BaseComponent from './base-component';
import { Messages } from '../constants';
import { mapToWorld } from '../utils';

export default class KeyController extends BaseComponent {

  constructor() {
    super();
    this.fixedFrequency = 1/10;
  }

  onInit() {
    super.onInit();
    this.subscribe(Messages.KEY_FETCHED);
    this.owner.pixiObj.visible = false;
  }

  onMessage(msg: ECSA.Message) {
    if(msg.action === Messages.KEY_FETCHED) {
      this.owner.destroy();
    }
  }

  onFixedUpdate(delta: number, absolute: number) {
    let keyPos = this.model.spawnKey();
    if(keyPos) {
      let worldPos = mapToWorld(keyPos.x, keyPos.y);
      this.owner.pixiObj.position.set(worldPos.x, worldPos.y);
      this.owner.pixiObj.visible = true;
    }
  }
}