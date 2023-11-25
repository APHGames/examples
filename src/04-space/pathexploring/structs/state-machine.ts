
/**
 * A structure each state has to implement
 */
export type State<Context, Result> = {
	// state name
	name: string;
	// handler that runs each tick
	handlerFunc: (context: Context) => Result;
	// called once after transition to the state
	firstRun?: (context: Context) => void;
	// called once before transition to another state
	cleanUp?: (context: Context) => void;
}

/**
 * A simple state machine with the possibility to get a callback
 * whenever a state changes
 */
export class StateMachine<Context, Result> {

	private states: Map<string, State<Context, Result>> = new Map();
	private transitions: Map<string, string> = new Map();
	private _currentState: State<Context, Result>;
	private running = false;
	private context: Context;

	private stateChangeObserver: (previous: string, next: string) => void;

	get currentState() {
		return this._currentState;
	}

	get isRunning() {
		return this.running;
	}

	addState(state: State<Context, Result>) {
		this.states.set(state.name, state);
		return this; // chainable
	}

	setInitialState(name: string) {
		this._currentState = this.states.get(name);
		return this; // chainable
	}

	addTransition(from: string, to: string) {
		this.transitions.set(from, to);
		return this; // chainable
	}

	setContext(context: Context) {
		this.context = context;
		return this; // chainable
	}

	addOnStateChangeObserver(observer: (previous: string, next: string) => void) {
		this.stateChangeObserver = observer;
		return this; // chainable
	}

	run() {
		if(!this.running) {
			this.running = true;
			this._currentState.firstRun?.(this.context);
			this.stateChangeObserver?.(null, this._currentState.name);
		}
		if(this._currentState) {
			const result = this._currentState.handlerFunc(this.context);
			if(result === null) {
				this._currentState.cleanUp?.(this.context);
				this.gotoNext();
				// run again
				this.run();
			} else {
				return result;
			}
		} else {
			// finish
			return null;
		}
	}

	private gotoNext() {
		const newState = this.transitions.get(this._currentState.name);
		if(newState) {
			const currentStateName = this._currentState.name;
			this._currentState = this.states.get(newState);
			this._currentState.firstRun?.(this.context);
			// we need to call it after first run
			this.stateChangeObserver?.(currentStateName, newState);
		} else {
			// a little bit lame, but whatever...
			this.stateChangeObserver?.(null, null);
			// finish
			this.running = false;
			return null;
		}
	}
}