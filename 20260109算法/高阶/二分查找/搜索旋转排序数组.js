/**
 * 搜索旋转排序数组, 什么叫旋转排序, 都是升序, 只不过截成了两部分[4,5,6,7]和[0,1,2]
 * 输入:
 * nums = [4,5,6,7,0,1,2], target = 0
 * 
 * 输出:
 * 4
 */

function search(nums, target) {
	const n = nums.length;
	let left = 0, right = n - 1;
	while(left <= right) {
		const mid = Math.floor((right + left)/2);
		if (nums[mid] === target) return mid;
		if (nums[left] <= nums[mid]) {
			if (nums[left] <= target && target < nums[mid]) {
				right = mid - 1;
			} else {
				left = mid + 1
			}
		} else {
			if (nums[mid] < target && target <= nums[right]) {
				left = mid + 1;
			} else {
				right = mid - 1;
			}
		}
	}
	return -1
}

// 算法时间复杂度O(logn), 算法空间复杂度O(1)
console.log(search([4,5,6,7,0,1,2], 0))