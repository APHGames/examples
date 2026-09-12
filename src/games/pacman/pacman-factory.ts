import { isMobileDevice } from 'colfio';
import ItemCollector from './components/item-collector';
import * as ECSA from 'colfio';
import { getLoadedTexture, textureFromFrame } from '../../utils/assets';
import PacmanModel from './pacman-model';
import { Assets, Attributes, defaultPositions, Names, SpecFunctions } from './constants';
import SpriteAnimator from './components/sprite-animator';
import { PacmanKeyController } from './components/pacman-controller';
import GateController from './components/gate-controller';
import SpiderSpawner from './components/spider-spawner';
import SpiderController from './components/spider-controller';
import { soundComponent } from './components/sound-component';
import SpriteData from './sprite-data';
import { getPacdotIdentifier, getPelletIdentifier, mapToWorld, getSpiderIdentifier, getLifeIconIdentifier } from './utils';
import GameController from './components/game-controller';
import ProximityChecker from './components/proximity-checker';
import KeyController from './components/key-controller';
import { PacmanLivesComponent } from './components/pacman-lives-component';

export default class PacmanFactory {

  private spritesData: {
    [key: string]: SpriteData
  };
  constructor(spritesData: any) {
    this.spritesData = spritesData;
  }

  initializeLevel(scene: ECSA.Scene, model: PacmanModel) {
    scene.clearScene();
    model.initLevel(2);

    scene.assignGlobalAttribute(Attributes.FACTORY, this);
    scene.assignGlobalAttribute(Attributes.MODEL, model);
    scene.assignGlobalAttribute(Attributes.SPRITESHEET_DATA, this.spritesData);

    const keyInput = isMobileDevice()
      ? new ECSA.VirtualGamepadComponent({
        KEY_LEFT: ECSA.Keys.KEY_LEFT,
        KEY_RIGHT: ECSA.Keys.KEY_RIGHT,
        KEY_UP: ECSA.Keys.KEY_UP,
        KEY_DOWN: ECSA.Keys.KEY_DOWN
      })
      : new ECSA.KeyInputComponent();
    scene.addGlobalComponent(keyInput);
    scene.assignGlobalAttribute(Attributes.KEY_INPUT, keyInput);
    scene.addGlobalComponent(new ItemCollector());
    scene.addGlobalComponent(new GameController());
    scene.addGlobalComponent(new ProximityChecker());
    scene.addGlobalComponent(new PacmanLivesComponent());
    scene.addGlobalComponent(soundComponent());

    let builder = new ECSA.Builder(scene);

    // create layers so that we don't have to mess up with Z-indices
    let layerItems = builder.withParent(scene.stage).withName(Names.LAYER_ITEMS).asContainer().build();
    builder.withParent(scene.stage).withName(Names.LAYER_CREATURES).asContainer().build();
    let layerbgr = builder.withParent(scene.stage).withName(Names.LAYER_BGR).asContainer().build();


    // add static elements
    builder
      .globalPos(defaultPositions.river)
      .withComponent(new SpriteAnimator(this.spritesData.river, this.spritesData.river.frames * (100 / model.gameSpeed), true))
      .withName(Names.RIVER)
      .asSprite(this.createTexture(this.spritesData.river))
      .withParent(layerbgr)
      .build();

    builder
      .globalPos(defaultPositions.fountain)
      .withComponent(new SpriteAnimator(this.spritesData.fountain, this.spritesData.fountain.frames * (100 / model.gameSpeed), true))
      .withName(Names.FOUNTAIN)
      .asSprite(this.createTexture(this.spritesData.fountain))
      .withParent(layerbgr)
      .build();

    builder
      .globalPos(defaultPositions.gate)
      .withAttribute(Attributes.SPRITE_DATA, this.spritesData.gate)
      .withComponent(new GateController())
      .withName(Names.GATE)
      .asSprite(this.createTexture(this.spritesData.gate))
      .withParent(layerbgr)
      .build();

    builder
      .globalPos(defaultPositions.spiderSpawner)
      .withComponent(new SpiderSpawner(15))
      .withAttribute(Attributes.SPRITE_DATA, this.spritesData.spider_gate)
      .withName(Names.SPIDER_GATE)
      .asSprite(this.createTexture(this.spritesData.spider_gate))
      .withParent(layerbgr)
      .build();

    // lives
    for(let i = 0; i < model.livesNum; i++) {
      builder
      .globalPos(550 - 40 * i, 0)
      .withName(getLifeIconIdentifier(i))
      .asSprite(this.createTexture(this.spritesData.pacman_win))
      .withParent(layerbgr)
      .build();
    }

    builder
    .withName(Names.BACKGROUND)
    .asSprite(getLoadedTexture(Assets.BACKGROUND))
    .withParent(layerbgr)
    .build();


    // add dynamic elements
    model.map.getTilesByFunction(SpecFunctions.PACDOT).forEach(pacdot => {
      builder
      .globalPos(mapToWorld(pacdot.pos.x, pacdot.pos.y))
      .withName(getPacdotIdentifier(pacdot.pos))
      .asSprite(this.createTexture(this.spritesData.dots))
      .withParent(layerItems)
      .build();
    });

    model.map.getTilesByFunction(SpecFunctions.PELLET).forEach(pellet => {
      builder
      .globalPos(mapToWorld(pellet.pos.x, pellet.pos.y))
      .withComponent(new SpriteAnimator(this.spritesData.pellets, this.spritesData.pellets.frames * (100 / model.gameSpeed), true))
      .withName(getPelletIdentifier(pellet.pos))
      .asSprite(this.createTexture(this.spritesData.pellets))
      .withParent(layerItems)
      .build();
    });

    builder
      .globalPos(-1, -1)
      .asSprite(this.createTexture(this.spritesData.key))
      .withParent(layerItems)
      .withComponent(new KeyController())
      .build();
    // add pacman
    this.spawnPacman(scene, model);
  }

  public spawnPacman(scene: ECSA.Scene, model: PacmanModel): ECSA.GameObject {
    return new ECSA.Builder(scene)
      .withAttribute(Attributes.GAME_UNIT, model.pacman)
      .globalPos(mapToWorld(model.pacman.pos.x, model.pacman.pos.y))
      .withComponent(new PacmanKeyController())
      .withName(Names.PACMAN)
      .asSprite(this.createTexture(this.spritesData.pacman_walk_left))
      .withParent(scene.findObjectByName(Names.LAYER_CREATURES))
      .build();
  }

  public spawnSpider(scene: ECSA.Scene, model: PacmanModel): ECSA.GameObject {
    let spider = model.spawnSpider();
    let builder = new ECSA.Builder(scene);

    let newObj = builder
      .withTag(getSpiderIdentifier(spider.id))
      .withAttribute(Attributes.GAME_UNIT, spider)
      .globalPos(mapToWorld(spider.pos.x, spider.pos.y))
      .withComponent(new SpiderController())
      .withName(Names.SPIDER)
      .asSprite(this.createTexture(this.spritesData.spider_walk_down))
      .withParent(scene.findObjectByName(Names.LAYER_CREATURES))
      .build();
    return newObj;
  }

  private createTexture(spriteInfo: any) {
    return textureFromFrame(getLoadedTexture(Assets.SPRITESHEET), spriteInfo.x, spriteInfo.y, spriteInfo.w, spriteInfo.h);
  }
}