1. 语法差异: class组件使用内置生命周期函数渲染的时候使用render函数来渲染;Hooks组件通过调用不同的Hooks来实现生命周期操作使用return函数来渲染

2. 状态管理: class组件使用`state`和`this.setState`来储存和管理状态;Hooks组件通过`useState`来管理状态, 通过`useEffect`来处理副作用

3. 生命周期方法: class组件有内置的生命周期`componentDidMount`,`componentDidUpdate`,`componentWillUnMount`;Hooks通过`useEffect`来模拟生命周期并通过在函数调用中返回一个清理函数来模拟`componentWillUnMount`

4. 代码组织: class组件有更多的样板代码如构造函数,state初始化,生命周期方法等;Hooks组件代码更简洁因为没有构造函数和显式的生命周期函数定义

5. 可复用性: class组件是组件render级别的复用而Hooks组件是组件方法级别的复用, 方法级别的复用更灵活

6. 学习曲线: 对于熟悉面向对象编程的人员来说, Class组件的学习曲线较低;Hooks对于新手来说可能更难掌握一些, 但是一旦掌握可以写出很简洁的代码