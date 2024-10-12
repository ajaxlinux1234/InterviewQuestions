# TypeScript 中 const 和 readonly 的区别？枚举和常量枚举的区别？接口和类型别名的区别？

## const和readonly的区别?
1. 作用域: const作用于常量或者数组, readonly作用于对象属性
2. 赋值时机: const在声明时或者第一次赋值时进行初始化, readonly可以在构造函数或声明时进行初始化
3. 类型推断: const变量在赋值时进行类型推断, readonly需要显式指定类型

```
// 使用 const
const pi: number = 3.14159;
pi = 3.14; // Error: Cannot assign to 'pi' because it is a constant or a read-only property.

// 使用 readonly
class Point {
  readonly x: number;
  readonly y: number;

  constructor(x: number, y: number) {
    this.x = x; // 初始化
    this.y = y;
  }

  // 错误：无法在构造函数之外分配只读属性
  setX(value: number) {
    this.x = value; // Error: Cannot assign to 'x' because it is a constant or a read-only property.
  }
}

const point = new Point(10, 20);
point.x = 15; // Error: Cannot assign to 'x' because it is a constant or a read-only property.
```


## 枚举和常量枚举?

1. 编译结果: 普通枚举在编译时会生成一个枚举对象, 常量枚举在编译不会生成对象
2. 使用场景: 普通枚举用于在运行时保留枚举对象的, 常量枚举用于在编译运行时使用具体的数值, 提高性能
3. 类型信息: 普通枚举在运行时可以访问其他枚举信息, 常量枚举在编译后不保留信息, 仅保留数值

```
// 普通枚举
enum Direction {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3
}

console.log(Direction.Up); // 输出 0

// 常量枚举
const enum ConstDirection {
  Up = 0,
  Down = 1,
  Left = 2,
  Right = 3
}

console.log(ConstDirection.Up); // 输出 0，但编译后的代码中没有枚举对象
```
## 接口和类型别名?

1. 扩展性: 接口支持合并, 可以多次声明同一个接口, 最终合并为同一个接口.类型别名不支持合并,后来的会覆盖之前的

2. 使用场景: 接口通常用于定义类的公共接口, 函数类型, 对象类型等. 类型别名通常用于复杂的类型组合, 如联合类型,元组类型

3. 类型检查: 接口可以用于类的继承和实现. 类型别名主要用于类型检查, 不支持类的继承和实现




