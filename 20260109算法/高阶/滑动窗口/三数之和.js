/**
 * 三数之和
 * 输入:
 * [-1,0,1,2,-1,-4]
 * 
 * 输出:
 * [[-1,-1,2],[-1,0,1]]
 */

// 排序后: [-4,-1,-1,0,1,2]

function threeSum(nums) {
	const res = [];
	const n = nums.length;
	
	if (n < 3) {
		return res
	}
	nums.sort((a,b) => a - b)
	for (let i = 0; i < n - 2; i++) {
		if (i > 0 && nums[i] === nums[i - 1]) continue;
		if (nums[i] > 0) break;
		let left = i + 1;
		let right = n - 1;
		while(left < right) {
			const sum = nums[i] + nums[left] + nums[right];
			if (sum === 0) {
				res.push([nums[i], nums[left], nums[right]])
				while (left < right && nums[left] === nums[left + 1]) {
					left++;
				}
				while (left < right && nums[right] === nums[right - 1]) {
					right--;
				}
				left++;
				right--;
			} else if (sum > 0) {
				right--;
			} else {
				left++;
			}
		}
	}
	return res
}

// 算法时间复杂度是O(n2), 算法空间复杂度是O(1)
console.log(threeSum([-1,0,1,2,-1,-4]))
