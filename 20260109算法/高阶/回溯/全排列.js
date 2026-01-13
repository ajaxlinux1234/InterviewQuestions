/**
 * 全排列
 * 
 * 输入: 
 * [1,2,3]
 * 
 * 输出:
 * [
		[1,2,3],
		[1,3,2],
		[2,1,3],
		[2,3,1],
		[3,1,2],
		[3,2,1]
	]
 */



function allSort(nums) {
	const res = [];
	const path = [];
	const used = new Array(nums.length).fill(false)
	
	function backtrack() {
		if (path.length === nums.length) {
			res.push([...path]);
			return
		}

		for (let i = 0; i < nums.length; i++) {
			if (used[i]) continue;
			path.push(nums[i]);
			used[i] = true
			backtrack();
			path.pop();
			used[i] = false
		}
	}
	backtrack();
	return res;
}

// 算法时间复杂度O(n!) 表示n的阶乘, 假如n为3, 那么n!就是3 * 2 * 1
// 算法空间复杂度O(n)

