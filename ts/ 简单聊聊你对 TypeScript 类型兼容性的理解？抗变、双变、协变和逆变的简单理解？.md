# 协变:当泛型类型参数的位置允许时,可以用子类型替代基类.ts中使用两个范型来约束返回值类型或只读属性

  ```typescript
  // 不使用协变
  function reverse<T>(arr: T[]): T[] {
    return arr.reverse()
  }

  reverse([1,2,3] as any)


  // 使用协变
  function map<T,U>(arr: T[], f: (item:T) => U): U[]{
    return arr.map(f)
  }

  map([1,2,3], String)
  ```

  # 逆变: 在某些情况下可以用基类替代子类, 在ts中, 逆变通常发生在参数类型中, 特别是当参数被用作输入时

 ```typescript
 function printAll<T>(arg: T[]): void {
    for (let i = 0; i < arg.length; i++) {
      console.log(arg[i]);
    }
 }

 // 逆变的例子
 function acceptSome<T>(cb: (arg: T[]) => void): void {
  cb(['hello'])
 }

 acceptSome(printAll)

 ```

 # 不变: 指既不是协变也不是逆变, 这是默认行为, 除非显示地标记为协变或逆变

```typescript
function process<T>(arg:T[]):T[] {
  return arg
}

let strings = ['hello', 'world'];
let num = [1, 2, 3];

process(strings)
process(num)
```

