/**
 * 括号生成
 * 输入:
 * n = 3
 * 
 * 输出:
 * ["((()))","(()())","(())()","()(())","()()()"]
 */


function generateParenthesis(n) {
	const res = [];

	function backtrack(path, left, right) {
		if (path.length === n * 2) {
			res.push(path);
			return
		}

		if (left < n) {
			backtrack(path + '(',  left + 1, right)
		}

		if (right < left) {
			backtrack(path + ')', left, right + 1)
		}
	}

	backtrack("", 0, 0)
	return res
}

// 算法时间复杂度O(Cₙ)

console.log(generateParenthesis(3))