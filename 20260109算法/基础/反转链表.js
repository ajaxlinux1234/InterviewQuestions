/**
 * 反转链表
 * 输入:
 * 1 -> 2 -> 3 -> 4 -> 5
 * 输出:
 * 5 -> 4 -> 3 -> 2 -> 1
 */

function reverseLink(head) {
	let prev = null;
	let curr = head;
	
	while(curr !== null) {
		const next = curr.next;
		curr.next = prev;
		prev = curr;
		curr = next;
	}
	return prev
}

const head = {
  val: 1,
  next: {
    val: 2,
    next: {
      val: 3,
      next: {
        val: 4,
        next: {
          val: 5,
          next: null
        }
      }
    }
  }
}

// 时间复杂度O(n), 空间复杂度O(1)
console.log(reverseLink(head))