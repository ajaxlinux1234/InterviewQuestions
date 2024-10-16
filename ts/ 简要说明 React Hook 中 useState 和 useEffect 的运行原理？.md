# useState 用于在函数组件中添加状态, 传入初始值, 返回一个[state, setState]的数组


初始化状态(根据useState传入的初始值, 初始化组件状态) -> 更新状态(调用setState传入最新的state可更新组件状态) -> 批量更新(多次调用setState, react会合并做为一次更新) -> 异步更新(在setState后面不能访问state, 不能拿到最新的state, 说明组件是异步更新)


# useEffect 用于执行副作用, 可在其中执行数据获取, 订阅或手动触发dom更新等, 执行一些类class组件中生命周期函数的操作, 使用方式假如是useEffect(effectFn, [dependencies])

副作用执行(组件渲染完成后effectFn会执行, dependencies改变后effectFn会再次执行) -> 

effectFn中可返回一个清理函数(该清理函数会在组件卸载前或下次渲染前作为清理函数执行, 如取消或清理dom更新) -> 

依赖追踪(如果dependencies为空数组, effectFn只会在组件挂载完成后执行一次, 如果不为空, 那么当依赖变化的时候, effectFn会重新执行) ->

异步执行(副作用的执行是异步的, 这意味着它不会影响浏览器屏幕绘制)


