/**
 * 合并两个有序数组
 * 输入:
 * nums1 = [1,2,3], nums2 = [2,5,6]
 * 
 * 输出: [1,2,2,3,5,6]
 */

function mergeSortedArr(arr1, arr2) {
	const result = [];
	const len1 = arr1.length;
	const len2 = arr2.length;
	let i = 0, j = 0;
	while(i < len1 && j < len2) {
		if (arr1[i] < arr2[j]) {
			result.push(arr1[i]);
			i++;
		} else {
			result.push(arr2[j])
			j++;
		}
	}
	if (i < len1) {
		result.push(...arr1.slice(i, len1))
	} else if (j > 0) {
		result.push(...arr2.slice(j, len2))
	}
	return result
}

// 时间复杂度O(m+n), 空间复杂度O(n)
console.log(mergeSortedArr([1,2,3], [2,5,6]))

// 可以对空间复杂度进行优化到O(1)


function mergeSortedArrInPlace(arr1, m, arr2, n) {
	let i = m - 1, j = n - 1, k = m + n - 1;
	while(i >= 0 && j >=0){
		if (arr1[i] > arr2[j]) {
			arr1[k] = arr1[i];
			i--;
		} else {
			arr1[k] = arr2[j];
			j--;
		}
		k--;
	}
	
	while(j >=0) {
		arr1[k] = arr1[j]
		j--;
		k--;
	}
	return arr1
}

// 时间复杂度O(m+n), 空间复杂度优化到了O(1)
console.log(mergeSortedArrInPlace([1,2,3], 3, [2,5,6,7], 4))