# 简单对比一下 Callback、Promise、Generator、Async 几个异步 API 的优劣？


## Callback: 
1. 回调函数因为被调用环境的变化而导致this指向的变化. 
2. 除此之外, 多个回调函数之间嵌套会导致回调地狱. 
3. 回调函数不能return数据.当我们想使用回调的结果数据时只能通过再次回调的形式
4. 在回调函数外部无用通过try...catch来捕获回调函数内部的错误

在使用第三方类库, 如果是以回调函数的形式使用, 还会造成以下问题

5. 使用者的回调函数没有进行错误捕获, 而恰恰第三方类库使用了错误捕获但是没有抛出该错误, 此时使用者很难感知到自己设计的回调函数有问题
6. 使用者难以控制第三方库的回调时机和回调次数, 这个回调的执行权限控制在第三方手里
7. 使用者无法改变第三方库的回调参数, 回调参数无法满足使用者的诉求



## Promise:
Callback会造成回调地狱的问题, 还有难以测试的问题. ES6的Promise利用[有限状态机](https://www.ruanyifeng.com/blog/2013/09/finite-state_machine_for_javascript.html)的原理来解决异步的处理问题, Promise提供异步编程API, 它的特点如下:

1. Promise对象的执行不受外界的影响, Promise对象有三种状态: pending(进行中), fulfilled(已成功), rejected(已失败), 只有Promise本身的异步操作可以改变Promise的状态, 其他的操作不能影响到状态的改变

2. Promise对象的执行状态不可变, Promise的状态变化只有两种可能, 第一种pending -> fulfilled, 第二种pending -> rejected

*有限状态机提供一种更优雅的方法来处理异步,异步的处理可以监听的异步状态的变化,而不是回调函数的形式,降低处理的复杂度,使处理更加优雅*


Promise 对象的执行状态不可变示例如下：

```
const promise = new Promise((resolve, reject) => {
  // 状态变更为 fulfilled 并返回结果 1 后不会再变更状态
  resolve(1);
  // 不会变更状态
  reject(4);
});

promise
  .then((result) => {
    // 在 ES 6 中 Promise 的 then 回调执行是异步执行（微任务）
    // 在当前 then 被调用的那轮事件循环（Event Loop）的末尾执行
    console.log('result: ', result);
  })
  .catch((error) => {
    // 不执行
    console.error('error: ', error);
  });

```


Promise内部的执行不会影响到外部的代码的例子:

```
const promise = new Promise<string>((resolve, reject) => {
  // 下述是异常代码
  console.log(a.b.c);
  resolve('hello');
});

promise
  .then((result) => {
    console.log('result: ', result);
  })
  // 去掉 catch 仍然会抛出错误，但不会退出进程终止脚本执行
  .catch((err) => {
    // 执行
    // ReferenceError: a is not defined
    console.error(err);
  });

setTimeout(() => {
  // 继续执行
  console.log('hello world!');
}, 2000);

```


Promise相对于Callback进行异步处理更加强大, 但是也有一些缺点:
1. 无法取消Promise的执行

2. 无法在Promise通过try...catch来捕获Promise内部的错误(Promise内部已捕获错误)

3. 状态单一, 每次决断只能产生一种状态结果, 需要不停的链式调用

## Generator
Promise解决了Callback回调地狱的问题, 但也照成了代码冗余, 如果一些异步任务不支持Promise语法就要进行一层Promise封装.Generator函数将异步编程带到一个全新的阶段, 它使得异步代码执行起来像同步那么简单

```
const firstPromise = (result) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(result * 2), 1000);
  });
};

const nextPromise = (result) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => resolve(result * 3), 1000);
  });
};


function* gen() {
  const firstResult = yield firstPromise(1)
  console.log('firstResult: ', firstResult) // 2
  const nextResult = yield nextPromise(firstResult)
  console.log('nextResult: ', nextResult) // 6
  return nextPromise(firstResult)
}

// Generator 自动执行器
function co(gen) {
  const g = gen()
  function next(data) {
    const result = g.next(data)
    if(result.done) {
      return result.value
    }
    result.value.then(data => {
      // 通过递归的方式处理相同的逻辑
      next(data)
    })
  }
  // 第一次调用 next 主要用于启动 Generator 函数
  // 内部指针会从函数头部开始执行，直到遇到第一个 yield 表达式
  // 因此第一次 next 传递的参数没有任何含义（这里传递只是为了防止 TS 报错）
  next(0)
}

co(gen)


```

## Async
是Generator函数的语法糖, 相对于Generator而言特性如下:

1. 内置执行器: Async内置了自动执行器, 设计代码时无需关心执行步骤

2. yield命令无约束: 在Generator中使用CO执行器时yield后必须是Promise对象或者Thunk函数,而Async语法的await后可以是Promise包装对象, 或者原始数据类型对象,数字,字符串,布尔值(此时会进行Promise.resolve()包装处理)

3. 会返回Promise




