import * as ECSA from 'colfio';
import { Messages, Assets } from '../constants';
import { sound } from '@pixi/sound';

export const soundComponent = () => new ECSA.FuncComponent('SoundComponent')
  .doOnMessage(Messages.PACDOT_EATEN, () => sound.play(Assets.SND_PACDOT))
  .doOnMessage(Messages.PACMAN_KILLED, () => sound.play(Assets.SND_DEATH))
  .doOnMessage(Messages.BONUS_TAKEN, () => sound.play(Assets.SND_PELLET))
  .doOnMessage(Messages.KEY_FETCHED, () => sound.play(Assets.SND_PELLET))
  .doOnMessage(Messages.SPIDER_KILLED, () => sound.play(Assets.SND_RUSHKILL));

