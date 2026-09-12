import * as ECSA from 'colfio';
import { Messages } from './constants';
import { DeathAnimation } from './death-animation';

export const deathChecker = () => new ECSA.FuncComponent('DeathChecker')
  .doOnMessage(Messages.UNIT_KILLED, (cmp, msg) => {
    let contextObj = msg.data as ECSA.GameObject;
    contextObj.addComponent(new ECSA.ChainComponent()
      .waitFor(new DeathAnimation())
      .call(() => contextObj.destroy()));
  });
