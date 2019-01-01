import { ATTR_PROJ_OWNER } from './Starshooter';
import DebugComponent from '../../ts/components/DebugComponent';
import { PixiRunner } from '../../ts/PixiRunner'
import { KEY_U } from './../../ts/components/KeyInputComponent';
import { DynamicsComponent } from './../../ts/components/DynamicsComponent';
import { ATTR_DYNAMICS, MSG_OBJECT_ADDED } from './../../ts/engine/Constants';
import { GenericComponent } from './../../ts/components/GenericComponent';
import { CameraComponent } from './../../ts/components/CameraComponent';
import Scene from '../../ts/engine/Scene';
import { PIXICmp } from '../../ts/engine/PIXIObject';
import PIXIObjectBuilder from '../../ts/engine/PIXIObjectBuilder';
import { KeyInputComponent, KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_X, KEY_I } from '../../ts/components/KeyInputComponent';
import Dynamics from '../../ts/utils/Dynamics';
import Vec2 from '../../ts/utils/Vec2';
import Component from '../../ts/engine/Component';
import Msg from '../../ts/engine/Msg';
import { DynamicsComponent } from '../../ts/components/DynamicsComponent';
import { GenericComponent } from '../../ts/components/GenericComponent';



// attributes
export const ATTR_PROJ_OWNER = "PROJ_OWNER";

// object tags
export const TAG_BORDER_TOP = "BORDER_TOP";
export const TAG_BORDER_LEFT = "BORDER_LEFT";
export const TAG_BORDER_RIGHT = "BORDER_RIGHT";
export const TAG_BORDER_BOTTOM = "BORDER_BOTTOM";

// flags
export const FLAG_ROCKET = 1;
export const FLAG_PROJECTILE = 2;

/**
 * Component that prevents objects from penetrating the wall
 */
class CollisionChecker extends Component {
    borders = new Array<PIXICmp.ComponentObject>();
    rockets = new Array<PIXICmp.ComponentObject>();
    projectiles = new Array<PIXICmp.ComponentObject>();

    onInit() {
        // add borders
        this.borders.push(this.scene.findFirstObjectByTag(TAG_BORDER_BOTTOM));
        this.borders.push(this.scene.findFirstObjectByTag(TAG_BORDER_TOP));
        this.borders.push(this.scene.findFirstObjectByTag(TAG_BORDER_LEFT));
        this.borders.push(this.scene.findFirstObjectByTag(TAG_BORDER_RIGHT));
        this.subscribe(MSG_OBJECT_ADDED);
        this.refreshCollections();
    }

    private refreshCollections() {
        this.rockets = this.scene.findAllObjectsByFlag(FLAG_ROCKET);
        this.projectiles = this.scene.findAllObjectsByFlag(FLAG_PROJECTILE);
    }

    onMessage(msg: Msg) {
        if (msg.action == MSG_OBJECT_ADDED) {
            this.refreshCollections();
        }
    }

    private checkCollisionGroups(group1: Array<PIXICmp.ComponentObject>, group2: Array<PIXICmp.ComponentObject>,
        onCollide: (objA: PIXICmp.ComponentObject, objB: PIXICmp.ComponentObject, horiz: number, vert: number) => void) {
        for (let objA of group1) {
            for (let objB of group2) {
                let obABox = objA.getPixiObj().getBounds();
                let objBox = objB.getPixiObj().getBounds();

                let horizIntersection = Math.min(obABox.right, objBox.right) - Math.max(obABox.left, objBox.left);
                let vertIntersection = Math.min(obABox.bottom, objBox.bottom) - Math.max(obABox.top, objBox.top);
                if (horizIntersection > 0 && vertIntersection > 0) {
                    onCollide(objA, objB, horizIntersection, vertIntersection);
                }
            }
        }
    }

    onUpdate(delta: number, absolute: number) {
        // borders - rockets collision
        this.checkCollisionGroups(this.borders, this.rockets, (objA, objB, horiz, vert) => {
            let dynamics = (<Dynamics>objB.getAttribute(ATTR_DYNAMICS));
            let tag = objA.getTag();
            if (tag == TAG_BORDER_BOTTOM || tag == TAG_BORDER_TOP) {
                dynamics.velocity.y *= -1;
                objB.getPixiObj().rotation += (dynamics.velocity.x < 0 == (tag == TAG_BORDER_BOTTOM)) ? Math.PI / 2 : -Math.PI / 2;
            }

            if (tag == TAG_BORDER_LEFT || tag == TAG_BORDER_RIGHT) {
                dynamics.velocity.x *= -1;
                objB.getPixiObj().rotation += (dynamics.velocity.y < 0 == (tag == TAG_BORDER_LEFT)) ? Math.PI / 2 : -Math.PI / 2;
            }
        });

        // borders - projectiles collision
        this.checkCollisionGroups(this.borders, this.projectiles, (objA, objB, horiz, vert) => {
            objB.remove();
        });

        // rockets - projectiles collision
        this.checkCollisionGroups(this.rockets, this.projectiles, (objA, objB, horiz, vert) => {
            if (objB.getAttribute(ATTR_PROJ_OWNER) != objA) {
                objA.remove();
            }
        });
    }
}

export default class Starshooter {

    private createBorder(parent: PIXICmp.ComponentObject, tag: string, posX: number, posY: number, rotation: number): PIXICmp.ComponentObject {
        let border = new PIXICmp.Graphics(tag);
        border.beginFill(0xFFFFFF);
        border.drawRect(0, 0, 30, 10000);
        border.endFill();
        border.position.set(posX, posY);
        border.rotation = rotation;
        parent.getPixiObj().addChild(border);
        return border;
    }

    init(scene: Scene) {
        scene.clearScene();
        let rootObject = scene.stage;

        let builder = new PIXIObjectBuilder(scene);

        // create border rectangles
        this.createBorder(rootObject, TAG_BORDER_LEFT, -5000, -5000, 0);
        this.createBorder(rootObject, TAG_BORDER_RIGHT, 5000, -5000, 0);
        this.createBorder(rootObject, TAG_BORDER_TOP, -5000, -5000, -Math.PI / 2);
        this.createBorder(rootObject, TAG_BORDER_BOTTOM, 5000, 5000, Math.PI / 2);

        // add player
        let droid = PIXI.Texture.fromImage("droid");
        let frame1 = new PIXI.Rectangle(128 * 0, 0, 100, 100);
        let frame2 = new PIXI.Rectangle(128 * 1, 0, 128, 128);
        let frame3 = new PIXI.Rectangle(128 * 2, 0, 128, 128);
        let frame4 = new PIXI.Rectangle(128 * 3, 0, 128, 128);
        let player = new PIXICmp.Sprite("PLAYER", droid);

        droid.frame = frame1;
        player.anchor.set(0.5);

        player.addComponent(new GenericComponent("SpriteAnimator")
            .doOnUpdate((cmp, delta, absolute) => {
                let dynamics = cmp.owner.getAttribute<Dynamics>(ATTR_DYNAMICS);
                if(dynamics.velocity.magnitudeSquared() > 0){
                    if(droid.frame == frame1){
                        droid.frame = frame2;
                    }else if(droid.frame == frame2){
                        droid.frame = frame3;
                    }else if(droid.frame == frame3) {
                        droid.frame = frame4;
                    }else{
                        droid.frame = frame2;
                    }
                }else{
                    droid.frame = frame1;
                }
            })
        );

        // add camera that will be looking at the player
        let camera = new CameraComponent();
        camera.lookAt(player);
        camera.size(1500);

        // add root components
        builder
            .withComponent(new KeyInputComponent())
            .withComponent(new CollisionChecker())
            .withComponent(camera)
            .build(rootObject);

        // add logic for the player
        builder
            .withFlag(FLAG_ROCKET)
            .withComponent(new DynamicsComponent(100))
            .withComponent(new GenericComponent("PlayerController")
                .doOnUpdate((cmp, delta, absolute) => {
                    let keyCmp = cmp.scene.stage.findComponentByClass(KeyInputComponent.name);
                    let cmpKey = <KeyInputComponent><any>keyCmp;
                    let dyn = (<Dynamics>player.getAttribute(ATTR_DYNAMICS));

                    // key controller
                    if (cmpKey.isKeyPressed(KEY_LEFT)) player.rotation -= 0.003 * delta;
                    if (cmpKey.isKeyPressed(KEY_RIGHT)) player.rotation += 0.003 * delta;
                    if (cmpKey.isKeyPressed(KEY_U)) camera.size(camera.width * 1.01);
                    if (cmpKey.isKeyPressed(KEY_I)) camera.size(camera.width / 1.01);
                    if (cmpKey.isKeyPressed(KEY_UP)) dyn.velocity = dyn.velocity.add(new Vec2(2 * Math.cos(player.rotation), 2 * Math.sin(player.rotation))).limit(100);
                    if (cmpKey.isKeyPressed(KEY_X)) {

                        let projectile = new PIXICmp.Graphics();
                        projectile.beginFill(0xFFFFFF);
                        projectile.drawCircle(0, 0, 4);
                        projectile.endFill();
                        let dynamics = new Dynamics(dyn.velocity.add(new Vec2(10 * Math.cos(cmp.owner.getPixiObj().rotation),
                            10 * Math.sin(cmp.owner.getPixiObj().rotation))));

                        new PIXIObjectBuilder(scene)
                            .withFlag(FLAG_PROJECTILE)
                            .withAttribute(ATTR_PROJ_OWNER, player)
                            .localPos(player.position.x + 100 * Math.cos(cmp.owner.getPixiObj().rotation), player.position.y + 100 * Math.sin(cmp.owner.getPixiObj().rotation))
                            .withComponent(new DynamicsComponent(100))
                            .withAttribute(ATTR_DYNAMICS, dynamics)
                            .build(projectile, rootObject);
                    }
                })
            )
            .build(player, rootObject);
    }
}