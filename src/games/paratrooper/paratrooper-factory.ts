import * as PIXI from 'pixi.js';
import * as ECSA from 'colfio';
import { isMobileDevice } from 'colfio';
import { getLoadedTexture, setTextureFrame } from '../../utils/assets';
import { CopterAnimator } from './copter-animator';
import { CopterComponent } from './copter-component';
import { ProjectileComponent } from './projectile-component';
import { soundComponent } from './sound-component';
import { Attributes, BFlags, Names, Assets, Messages, States } from './constants';
import { ParatrooperModel } from './paratrooper-model';
import { CopterSpawner } from './copter-spawner';
import { CollisionManager } from './collision-manager';
import { GameManager } from './game-manager';
import { CannonInputController } from './cannon-controller';
import { ParatrooperComponent } from './paratrooper-component';
import { CopterMovement } from './copter-movement';
import { CollisionResolver } from './collision-resolver';
import Dynamics from './utils/dynamics';
import { deathChecker } from './death-checker';

export default class ParatrooperFactory {

  // global scale for sprites, calculated in Paratrooper.ts
  static globalScale = 1;
  // width of the screen, depends on current aspect ratio
  // calculated in Paratrooper.ts
  static screenWidth = 1;
  private configData: any;

  initializeGame(rootObject: ECSA.Container, model: ParatrooperModel) {

    let scene = rootObject.scene;
    let builder = new ECSA.Builder(scene);

    // add root components
    builder
      .withComponent(new GameManager())
      .withComponent(soundComponent())
      .withComponent(new CopterSpawner())
      .withComponent(new CollisionManager())
      .withComponent(new CollisionResolver())
      .withComponent(deathChecker())
      .buildInto(rootObject);

    const keyInput = isMobileDevice()
      ? new ECSA.VirtualGamepadComponent({
        KEY_LEFT: ECSA.Keys.KEY_LEFT,
        KEY_RIGHT: ECSA.Keys.KEY_RIGHT,
        KEY_X: ECSA.Keys.KEY_UP
      })
      : new ECSA.KeyInputComponent();
    rootObject.addComponent(keyInput);
    scene.assignGlobalAttribute(Attributes.KEY_INPUT, keyInput);

    // create ground
    let ground = new ECSA.Graphics(Names.GROUND);
    (ground.pixiObj as PIXI.Graphics).rect(0, 46, ParatrooperFactory.screenWidth, 0.2).fill({ color: 0x00FFFF });
    rootObject.pixiObj.addChild(ground);

    // create labels
    // bug - bitmaptext contains other elements to which global scale were not applied
    builder.relativePos(0.75, 0.93).scale(ParatrooperFactory.globalScale).anchor(1, 1)
      .withComponent(new ECSA.FuncComponent('ScoreComponent').doOnUpdate((cmp, delta, absolute) => {
        (cmp.owner.pixiObj as PIXI.BitmapText).text = 'SCORE: ' + Math.floor(model.score);
      }))
      .withName(Names.SCORE).asBitmapText('', Assets.FONT, 20, 0xFFFFFF)
      .withParent(rootObject)
      .build();

    // game over label
    builder.relativePos(0.4, 0.5).scale(ParatrooperFactory.globalScale).anchor(0.5, 0.5)
      .withName(Names.GAMEOVER).asBitmapText('GAME OVER', Assets.FONT, 20, 0xFFFFFF)
      .withParent(rootObject)
      .build<ECSA.BitmapText>().pixiObj.visible = false;

    // number of lives
    builder.relativePos(0.1, 0.93).scale(ParatrooperFactory.globalScale).anchor(0, 1)
      .withComponent(new ECSA.FuncComponent('LivesComponent').doOnUpdate((cmp, delta, absolute) => {
        (cmp.owner.pixiObj as PIXI.BitmapText).text = 'LIVES: ' + Math.max(0, model.maxLandedUnits - model.landedUnits);
      }))
      .withName(Names.LIVES).asBitmapText('', Assets.FONT, 20, 0xFFFFFF)
      .withParent(rootObject)
      .build();

    // tower
    builder
      .relativePos(0.5, 0.92)
      .scale(ParatrooperFactory.globalScale)
      .anchor(0.5, 1)
      .withName(Names.TOWER)
      .asSprite(getLoadedTexture(Assets.TEX_TOWER))
      .withParent(rootObject)
      .build();

    // turret
    let turret = builder
      .relativePos(0.5, 0.8)
      .scale(ParatrooperFactory.globalScale)
      .anchor(0.5, 1)
      .withParent(rootObject)
      .withName(Names.TURRET)
      .asSprite(getLoadedTexture(Assets.TEX_TURRET))
      .build();

    // cannon
    builder
      .relativePos(0.0, -0.4)
      .anchor(0.5, 1)
      .withComponent(new CannonInputController())
      .withParent(turret)
      .withName(Names.CANNON)
      .asSprite(getLoadedTexture(Assets.TEX_CANNON))
      .build();
  }

  createProjectile(canon: ECSA.GameObject, model: ParatrooperModel) {

    let rootObject = canon.scene.stage;
    let canonPixi = canon.pixiObj;
    let rotation = canonPixi.rotation;
    let height = canonPixi.getBounds().height;
    let canonGlobalPos = canonPixi.toGlobal(new PIXI.Point(0, 0));
    let velocityX = model.projectileVelocity * Math.cos(rotation - Math.PI / 2);
    let velocityY = model.projectileVelocity * Math.sin(rotation - Math.PI / 2);
    let dynamics = new Dynamics();
    dynamics.velocity = new ECSA.Vector(velocityX, velocityY);
    dynamics.aceleration = new ECSA.Vector(0, model.gravity); // add gravity

    // we need the projectile to be at the same location as the cannon with current rotation
    let obj = new ECSA.Builder(canon.scene)
      .globalPos(canonGlobalPos.x + height * Math.sin(rotation), canonGlobalPos.y - height * Math.cos(rotation))
      .scale(ParatrooperFactory.globalScale)
      .withFlag(BFlags.PROJECTILE)
      .withAttribute(Attributes.DYNAMICS, dynamics)
      .withComponent(new ProjectileComponent())
      .withParent(rootObject)
      .withName(Names.PROJECTILE)
      .asSprite(getLoadedTexture(Assets.TEX_PROJECTILE))
      .build();

    canon.scene.sendMessage(new ECSA.Message(Messages.PROJECTILE_FIRED, null, null));
    return obj;
  }

  createParatrooper(owner: ECSA.GameObject, model: ParatrooperModel) {
    let dynamics = new Dynamics();
    dynamics.aceleration = new ECSA.Vector(0, model.gravity);

    let obj = new ECSA.Builder(owner.scene)
      .scale(ParatrooperFactory.globalScale)
      .anchor(0.5, 1)
      .withFlag(BFlags.COLLIDABLE)
      .localPos(owner.pixiObj.position.x, owner.pixiObj.position.y)
      .withAttribute(Attributes.DYNAMICS, dynamics)
      .withComponent(new ParatrooperComponent())
      .withState(States.FALLING)
      .withParent(owner.scene.stage)
      .withName(Names.PARATROOPER)
      .asSprite(getLoadedTexture(Assets.TEX_PARATROOPER))
      .build();
    owner.scene.sendMessage(new ECSA.Message(Messages.PARATROOPER_CREATED, null, null));
    return obj;
  }

  createCopter(owner: ECSA.GameObject, model: ParatrooperModel) {
    let root = owner.scene.stage;

    // 50% probability that the copter will be spawned on the left side
    let spawnLeft = Math.random() > 0.5;
    let posY = Math.random() * (model.copterSpawnMaxY - model.copterSpawnMinY) + model.copterSpawnMinY;
    let posX = spawnLeft ? -0.2 : 1.2;
    let velocity = (spawnLeft ? 1 : -1) * Math.random() * (model.copterMaxVelocity - model.copterMinVelocity) + model.copterMinVelocity;
    let dynamics = new Dynamics();
    dynamics.velocity = new ECSA.Vector(velocity, 0);

    let obj = new ECSA.Builder(owner.scene)
      .withFlag(BFlags.COLLIDABLE)
      .withAttribute(Attributes.DYNAMICS, dynamics)
      .withComponent(new CopterComponent())
      .withComponent(new CopterMovement())
      .withComponent(new CopterAnimator())
      .relativePos(posX, posY)
      .anchor(0.5, 0.5)
      .scale(ParatrooperFactory.globalScale)
      .withParent(root)
      .withName(Names.COPTER)
      .asSprite(getLoadedTexture(Assets.TEX_COPTER_LEFT))
      .build();
    owner.scene.sendMessage(new ECSA.Message(Messages.COPTER_CREATED, null, null));
    return obj;
  }

  resetGame(scene: ECSA.Scene, data?: any) {
    if (data) {
      this.configData = data;
    }
    scene.clearScene();
    let model = new ParatrooperModel();
    model.loadModel(this.configData);
    scene.assignGlobalAttribute(Attributes.FACTORY, this);
    scene.assignGlobalAttribute(Attributes.MODEL, model);

    // a simple hack that displays intro animation
    let counter = 0;
    new ECSA.Builder(scene)
      .scale(ParatrooperFactory.globalScale)
      .relativePos(0.1)
      .asSprite(getLoadedTexture(Assets.TEX_LOGO))
      .withParent(scene.stage)
      .withComponent(new ECSA.FuncComponent('animator')
        .setFixedFrequency(5).doOnFixedUpdate((cmp, delta, absolute) => {
          setTextureFrame(cmp.owner.pixiObj as { texture: import('pixi.js').Texture }, getLoadedTexture(Assets.TEX_LOGO), 0, 0, Math.min(436, (counter++) * 39), 48);
          if(counter === 20) {
            cmp.owner.destroy();
            // it is better to call initializeGame from within callWithDelay -> we can be sure that
            // the scene will be initialized AFTER it finishes the current update loop. This closure is executed
            scene.callWithDelay(0, () => this.initializeGame(scene.stage, model));
          }
        }))
      .build();
  }
}