/**
 * 输入:
 * "A man, a plan, a canal: Panama"
 * 
 * 输出:
 * true
 * 
 *
 */

function isPlaindrome(str) {
	let i = 0, j = str.length - 1;
	while(i < j) {
		if (!/[a-zA-Z\d]/.test(str[i])) {
			i++;
			continue
		}
		if (!/[a-zA-Z\d]/.test(str[j])) {
			j--;
			continue
		}
		if (str[i].toLowerCase() !== str[j].toLowerCase()) {
			return false
		} 
		i++;
		j--;
	}
	return true
}

// 上述解法的时间复杂度是O(n)
console.log(isPlaindrome('issi'))
console.log(isPlaindrome("A man, a plan, a canal: Panama"))
console.log(isPlaindrome("A na"))
console.log(isPlaindrome('ABC'))
console.log(isPlaindrome('ABA'))
console.log(isPlaindrome('A'))