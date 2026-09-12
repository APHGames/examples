export default class Queue<T> {
	private items: T[] = [];

	enqueue(elem: T): boolean {
		return this.add(elem);
	}

	add(elem: T): boolean {
		if (elem === undefined) {
			return false;
		}
		this.items.push(elem);
		return true;
	}

	dequeue(): T | undefined {
		return this.items.shift();
	}

	peek(): T | undefined {
		return this.items[0];
	}

	size(): number {
		return this.items.length;
	}

	isEmpty(): boolean {
		return this.items.length === 0;
	}

	clear(): void {
		this.items = [];
	}
}
