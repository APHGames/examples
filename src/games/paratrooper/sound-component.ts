import * as ECSA from 'colfio';
import { Messages, Assets } from './constants';
import { sound } from '@pixi/sound';

export const soundComponent = () => new ECSA.FuncComponent('SoundComponent')
.doOnMessage(Messages.PROJECTILE_FIRED, (cmp, msg) => sound.play(Assets.SND_FIRE))
.doOnMessage(Messages.GAME_OVER, (cmp, msg) => sound.play(Assets.SND_GAMEOVER))
.doOnMessage(Messages.UNIT_KILLED, (cmp, msg) => sound.play(Assets.SND_KILL));