/**
 * 盛最多水的容器
 * 输入: [1,8,6,2,5,4,8,3,7]
 * 
 * 输出: 
 * 49
 */
function getMaxArea(height) {
	let left = 0;
	let maxArea = 0;
	let right = height.length - 1;
	while(left < right) {
		maxArea = 
			Math.max(
				maxArea,
				Math.min(height[right], height[left]) * (right - left)
			);
		if (height[left] < height[right]) {
			left++;
		} else {
			right--;
		}
	}
	return maxArea
}

// 算法时间复杂度是O(n), 空间复杂度是O(1)

// 为什么右指针从最右边开始? 移动高的一边永远不能得到最大面积

console.log(getMaxArea([1,8,6,2,5,4,8,3,7]))