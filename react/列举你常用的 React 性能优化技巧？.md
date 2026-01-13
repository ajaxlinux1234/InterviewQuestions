# 使用 React.memo 和 React.PureComponent
1. React.memo是一个高阶组件, 只有当props发生变化时组件才会重新渲染
2. React.PureComponent是一个类组件的基类, 提供了浅层props和state比较, 只有当props或state发生变化时才会重新渲染

# 使用useMemo和useCallback


1. useMemo用于缓存昂贵的计算结果, 只有依赖项变化时才会重新计算

2. useCallback用于返回一个memoized回调函数, 只有当依赖项发生变化时才会创建新的回调函数


# 懒加载组件

React.lazy懒加载初始化非必要组件

# 使用shouldComponentUpdate生命周期来控制具体渲染粒度


# 使用Context API来逐层传递数据, 而无需手动逐层传递props

# 当组件返回多个元素时, 使用Fragment可以避免额外的Dom结点