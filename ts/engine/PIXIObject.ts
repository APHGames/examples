import Component from './Component';
import GameObjectProxy from './GameObjectProxy';

/**
 * Namespace for all PIXI objects that are to be 
 * integrated with the component architecture
 */
export namespace PIXICmp {

    /**
     * PIXI object attached to the component architecture
     */
    export interface ComponentObject {
        /**
         * Link to proxy object, shouldn't be used from within any component
         */
        proxy: GameObjectProxy;
        /**
         * Returns wrapped pixi object
         */
        getPixiObj(): PIXI.Container;
        /**
         * Adds a new component
         */
        addComponent(component: Component);
        /**
         * Removes an existing component
         */
        removeComponent(component: Component);
        /**
         * Removes component by given class name
         */
        removeComponentByClass(name: string) : boolean;
        /**
         * Tries to find a component by its class
         */
        findComponentByClass(name: string);
        /**
         * Adds a new generic attribute
         */
        addAttribute(key: string, val: any);
        /**
         * Returns an attribute by its key
         */
        getAttribute(key: string): any;
        /**
         * Removes an existing attribute
         * Returns true if the attribute was successfully removed
         */
        removeAttribute(key: string) : boolean;
        /**
         * Removes itself from its parent
         */
        remove();
        
    }

    export class Graphics extends PIXI.Graphics implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject>(
            child: T,
            ...additionalChildren: PIXI.DisplayObject[]
        ): T {
            let newChild = super.addChild(child, ...additionalChildren);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);

            for(let additional of additionalChildren){
                cmbObj = <ComponentObject><any>additional;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild(child: PIXI.DisplayObject): PIXI.DisplayObject{
            let removed = super.removeChild(child);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject{
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[]{
            let removed = super.removeChildren(beginIndex, endIndex);
            for(let removedObj of removed){
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string) : boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string) {
            this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute(key: string): any {
            this.proxy.getAttribute(key);
        }
        removeAttribute(key: string) : boolean {
            return this.proxy.removeAttribute(key);
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.gameObject;
        }
        remove(){
            this.parent.removeChild(this);
        }
    }

    export class Container extends PIXI.Container implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject>(
            child: T,
            ...additionalChildren: PIXI.DisplayObject[]
        ): T {
            let newChild = super.addChild(child, ...additionalChildren);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);

            for(let additional of additionalChildren){
                cmbObj = <ComponentObject><any>additional;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild(child: PIXI.DisplayObject): PIXI.DisplayObject{
            let removed = super.removeChild(child);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject{
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[]{
            let removed = super.removeChildren(beginIndex, endIndex);
            for(let removedObj of removed){
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string) : boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string) {
            this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute(key: string): any {
            this.proxy.getAttribute(key);
        }
        removeAttribute(key: string) : boolean {
            return this.proxy.removeAttribute(key);
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.gameObject;
        }
        remove(){
            this.parent.removeChild(this);
        }
    }

    export class Sprite extends PIXI.Sprite implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject>(
            child: T,
            ...additionalChildren: PIXI.DisplayObject[]
        ): T {
            let newChild = super.addChild(child, ...additionalChildren);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);

            for(let additional of additionalChildren){
                cmbObj = <ComponentObject><any>additional;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild(child: PIXI.DisplayObject): PIXI.DisplayObject{
            let removed = super.removeChild(child);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject{
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[]{
            let removed = super.removeChildren(beginIndex, endIndex);
            for(let removedObj of removed){
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string) : boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string) {
            this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute(key: string): any {
            this.proxy.getAttribute(key);
        }
        removeAttribute(key: string) : boolean {
            return this.proxy.removeAttribute(key);
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.gameObject;
        }
        remove(){
            this.parent.removeChild(this);
        }
    }


    export class ParticleContainer extends PIXI.particles.ParticleContainer implements ComponentObject {
        proxy: GameObjectProxy;

        constructor(tag: string = "") {
            super();
            this.proxy = new GameObjectProxy(tag, this);
        }

        // overrides pixijs function
        addChild<T extends PIXI.DisplayObject>(
            child: T,
            ...additionalChildren: PIXI.DisplayObject[]
        ): T {
            let newChild = super.addChild(child, ...additionalChildren);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);

            for(let additional of additionalChildren){
                cmbObj = <ComponentObject><any>additional;
                this.proxy.onChildAdded(cmbObj.proxy);
            }

            return newChild;
        }

        // overrides pixijs function
        addChildAt<T extends PIXI.DisplayObject>(child: T, index: number): T {
            let newChild = super.addChildAt(child, index);
            let cmbObj = <ComponentObject><any>newChild;
            this.proxy.onChildAdded(cmbObj.proxy);
            return newChild;
        }

        // overrides pixijs function
        removeChild(child: PIXI.DisplayObject): PIXI.DisplayObject{
            let removed = super.removeChild(child);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildAt(index: number): PIXI.DisplayObject{
            let removed = super.removeChildAt(index);
            let cmpObj = <ComponentObject><any>removed;
            this.proxy.onChildRemoved(cmpObj.proxy);
            return removed;
        }

        // overrides pixijs function
        removeChildren(beginIndex?: number, endIndex?: number): PIXI.DisplayObject[]{
            let removed = super.removeChildren(beginIndex, endIndex);
            for(let removedObj of removed){
                let cmpObj = <ComponentObject><any>removedObj;
                this.proxy.onChildRemoved(cmpObj.proxy);
            }
            return removed;
        }

        addComponent(component: Component) {
            this.proxy.addComponent(component);
        }
        removeComponent(component: Component) {
            this.proxy.removeComponent(component);
        }
        removeComponentByClass(name: string) : boolean {
            return this.proxy.removeComponentByClass(name);
        }
        findComponentByClass(name: string) {
            this.proxy.findComponentByClass(name);
        }
        addAttribute(key: string, val: any) {
            this.proxy.addAttribute(key, val);
        }
        getAttribute(key: string): any {
            this.proxy.getAttribute(key);
        }
        removeAttribute(key: string) : boolean {
            return this.proxy.removeAttribute(key);
        }
        getPixiObj(): PIXI.Container {
            return this.proxy.gameObject;
        }
        remove(){
            this.parent.removeChild(this);
        }
    }
}
