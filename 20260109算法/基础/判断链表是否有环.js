/**
 * 判断链表是否有环
 * 输入:
 * 1 -> 2 -> 3 -> 4 -> 2
 * 输出:
 * true
 */

class LinkNode {
	constructor(val) {
		this.val = val;
		this.next = null
	}
}


function isCircleLink(head) {
	let slow = head;
	let fast = head;
	while(fast !== null && fast.next !== null) {
		slow = slow.next
		fast = fast.next.next

		if (slow === fast ) {
			return true
		}
	}
	return false
}
// 时间复杂度O(n), 空间复杂度O(1)
const a = new LinkNode(3);
const b = new LinkNode(2);
const c = new LinkNode(1);
const d = new LinkNode(-1);

a.next = b;
b.next = c;
c.next = d;
d.next = a;

console.log(isCircleLink(a))