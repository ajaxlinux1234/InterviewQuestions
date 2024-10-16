1. 同名的interface可以合并
```typescript
interface Animal {
  name: string;
}

interface Animal {
  age: number;
}

const animal: Animal = {
  name: 'Kitty',
  age: 3
};
```

2. 类和接口可以进行组合

```typescript
interface Animal {
  name: string;
  age: number;
}

// 定义一个类，并让它实现 Animal 接口
class Pet implements Animal {
  name: string;
  age: number;

  constructor(name: string, age: number) {
    this.name = name;
    this.age = age;
  }

  // 可以在这里定义类特有的方法
  bark(): void {
    console.log('Woof!');
  }
}

// 使用类的类型签名
const pet: Pet = {
  name: 'Buddy',
  age: 2,
  bark: function() {} // 需要实现 bark 方法
};

// 使用类的实例
const buddy = new Pet('Buddy', 2);
buddy.bark(); // 输出: Woof!
```