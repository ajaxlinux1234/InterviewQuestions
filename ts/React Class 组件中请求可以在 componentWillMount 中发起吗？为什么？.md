1. 可预测性: componentWillMount不一定会在组件挂载前执行, 尤其是在组件渲染和更新变得异步后, 或者在SSR和服务端渲染的情况下, 而componentDidMount在组件挂载后立即执行,更可预测

2. 生命周期的一致性: 现代React更倾向于使用componentDidMount进行初始化工作, 以保证生命周期一致性

3. componentWillMount在未来版本中会被废弃,导致该方法无法在未来版本中被打包编译
