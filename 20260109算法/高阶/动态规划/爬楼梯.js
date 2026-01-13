/**
 * 爬楼梯
 * 
 * 输入:
 * n = 5
 * 
 * 输出:
 * 8
 */

function claimStairs(n) {
	if (n <= 2) return n;
	let prev2 = 1;
	let prev1 = 2;

	for (let i = 3; i <= n; i++) {
		const cur = prev1 + prev2;
		prev2 = prev1;
		prev1 = cur;
	}
	return prev1
}

// 算法时间复杂度是O(n), 空间复杂度是O(1)
console.log(claimStairs(5))