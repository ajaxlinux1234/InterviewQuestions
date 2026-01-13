/**
 * 查找第一个和最后一个位置
 * 输入:
 * nums = [5,7,7,8,8,10], target = 8
 * 
 * 输出: 
 * [3, 4]
 */

function findFirstLast(nums, target) {
	const n = nums.length;
	let left = 0, right = n -1;
	let first = -1, last = -1;
	while(left <= right) {
		const mid = Math.floor((left + right)/2);
		if (nums[mid] > target) {
			right = mid - 1
		} else if (target > nums[mid]) {
			left = mid + 1
		} else {
			first = mid;
			right= mid - 1;
		}
	}

	if (first === -1) return [-1, -1]

	left = first
	right = n - 1

	while(left <= right) {
		const mid = Math.floor((left + right)/2);
		if (nums[mid] > target) {
			right = mid - 1
		} else if (target > nums[mid]) {
			left = mid + 1
		} else {
			last = mid;
			left = mid + 1;
		}
	}

	return [first, last]
}


// 算法时间复杂度O(log n), 空间复杂度O(1)
console.log(findFirstLast([5,7,7,8,8,8,10], 8))