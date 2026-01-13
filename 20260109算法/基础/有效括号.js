/**
 * 有效括号
 * 输入:
 * "()[]{}"
 * 输出:
 * true
 * 
 * 输入:
 * "{[]}"
 * 输出:
 * true
 */

function isValidParentheses(str) {
	const stack = []
	const map = {
		")": "(",
		"]": "[",
		"}": "{"
	}
	for (const ch of str) {
		if (ch === '(' || ch === '[' || ch === '{') {
			stack.push(ch)
		} else {
			if (stack.pop() !== map[ch]) {
				return false
			}
		}
	}

	return stack.length === 0
}
// 时间复杂度O(n), 空间复杂度O(n)
console.log(isValidParentheses("()[]{}"))
console.log(isValidParentheses("()[]"))
console.log(isValidParentheses("()["))
console.log(isValidParentheses("()"))
console.log(isValidParentheses("{[]}"))