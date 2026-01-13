/**
 * 最大子数组和
 * 输入: [-2,1,-3,4,-1,2,1,-5,4]
 * 输出: 6
 */

function maxChildSum(arr) {
	let currentSum = arr[0]
	let maxSum = arr[0]
	for (let i = 1; i < arr.length; i++) {
		currentSum = Math.max(arr[i], currentSum + arr[i])
		maxSum = Math.max(currentSum, maxSum)
	}
	return maxSum
}

// 算法时间复杂度O(n), 空间复杂度是O(1)
console.log(maxChildSum([-2,1,-3,4,-1,2,1,-5,4]))