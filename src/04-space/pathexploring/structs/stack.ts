

type StackNode<T> = {
	node: T;
	next: StackNode<T>;
}

/**
 * Generic stack that implements FIFO behavior
 */
export class Stack<T> {
	root: StackNode<T>;

	push(node: T) {
		if (!this.root) {
			this.root = {
				node,
				next: null,
			};
		} else {
			this.root = {
				node,
				next: this.root
			};
		}
	}

	pop() {
		const top = this.root.node;
		this.root = {
			node: this.root?.next?.node,
			next: this.root?.next?.next
		};
		return top;
	}

	top() {
		return this.root?.node;
	}

	getNodes(): T[] {
		const output: T[] = [];
		let node = this.root;
		while (node && node.node) {
			output.push(node.node);
			node = node.next;
		}
		return output;
	}

	isEmpty() {
		return !this.root || !this.root.node;
	}
}