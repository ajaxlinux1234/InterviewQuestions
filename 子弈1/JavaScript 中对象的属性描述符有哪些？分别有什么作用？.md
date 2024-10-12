# JavaScript 中对象的属性描述符有哪些？分别有什么作用？

```
let obj = {
  name: 'a',
  fullName: '',
  firstName: ''
}
Object.defineProperty(obj, 'name', {
  value: 'b',
  writeable: true,
  enumerable: false, // 默认为 false
  configurable: false // 默认为 false
})

Object.defineProperty(obj, 'fullName', {
  get: function(value) {
    return `完整的姓名是:${this.fullName}`
  },
  set: function(value) {
    this.firstName = value.split(' ')[0]
  }
})
```
## 数据描述符
1. value: 属性的值

2. writeable: 属性值是否可以被修改

## 存取器描述符

3. get: 获取属性值时调用的函数

4. set: 设置属性值时调用的函数

## 属性的可枚举性和可描述性描述符

5. enumerable: 表示该属性值是否可以被for...in或Object.keys()方法来枚举

6. configurable: 表示该属性描述符是否可以被修改, 或者该属性是否可以被对象删除

7. getOwnPropertyDescriptor: 该方法用于获取对象的描述符

```
let obj = {
  name: 'Alice'
};

let desc = Object.getOwnPropertyDescriptor(obj, 'name');
console.log(desc); // 输出: { value: 'Alice', writable: true, enumerable: true, configurable: true }
```




