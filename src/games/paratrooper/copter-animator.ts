import { Vector } from 'colfio';
import { Assets, Attributes } from './constants';
import { ParatrooperBaseCmp } from './paratrooper-base-component';
import Dynamics from './utils/dynamics';
import { getLoadedTexture } from '../../utils/assets';

/**
 * Component that only changes sprite according to the direction of attached copter
 */
export class CopterAnimator extends ParatrooperBaseCmp {
  lastVelocity = new Vector(0, 0);

  onUpdate(delta: number, absolute: number) {
    let dynamics = this.owner.getAttribute<Dynamics>(Attributes.DYNAMICS);
    let velocity = dynamics.velocity;

    if (Math.sign(velocity.x) !== Math.sign(this.lastVelocity.x) || this.lastVelocity.x === 0) {
      if (velocity.x < 0) {
        // to the left
        (this.owner.pixiObj as { texture: import('pixi.js').Texture }).texture = getLoadedTexture(Assets.TEX_COPTER_LEFT);
      } else {
        // to the right
        (this.owner.pixiObj as { texture: import('pixi.js').Texture }).texture = getLoadedTexture(Assets.TEX_COPTER_RIGHT);
      }
    }
  }
}