/**
 * 无重复字符的最长子串
 * 输入: "abcdabcbb"
 * 输出: 3
 */

function getMaxLenSub(str) {
	let set = new Set();
	let left = 0;
	let maxLen = 0;

	for (let right = 0, len = str.length; right < len; right++) {
		if (set.has(str[right])) {
			set.delete(str[right])
			left++;
		}
		set.add(str[right])
		maxLen = Math.max(maxLen, right - left + 1)
	}
	return maxLen
}

// 算法时间复杂度O(n), 空间复杂度O(n)

console.log(getMaxLenSub("abcdabcbb"))
console.log(getMaxLenSub("dvdf"))