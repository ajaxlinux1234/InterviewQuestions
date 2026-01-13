class MinStack {
	constructor() {
		this.stack = []; // 主栈
		this.miniStack = [];// 最小辅助栈
	}

	push(data) {
		this.stack.push(data);
		if (!this.miniStack.length) {
			this.miniStack.push(data)
		} else {
			this.miniStack.push(Math.min(data, this.getMin()))
		}
	}

	pop() {
		if (this.stack.length === 0) return null;
		this.miniStack.pop();
		return this.stack.pop()
	}

	top() {
		if (!this.stack.length) return null;
		return this.stack[this.stack.length -  1]
	}

	getMin() {
		if (!this.miniStack.length) return null
		return this.miniStack[this.miniStack.length - 1]
	}
}

const minStack = new MinStack();

minStack.push(3);
minStack.push(5);
minStack.push(2);
minStack.push(4);

console.log(minStack.getMin()); // 2
console.log(minStack.pop()); // 4
console.log(minStack.top()); // 2
console.log(minStack.getMin());// 2