# vue2跟vue3的区别

1. Composition API: vue3引入了composition API与vue2的Option API相比更适合复用逻辑, 可以更清晰的阻止代码

2. 渲染机制: vue3采用运行时编译分离,意味着vue3的核心不再包含模板编译器.模板编译现在是在构建中完成的,而不是在运行时.这意味着vue3的核心更小,更快.

3. 响应式系统: vue3采用proxy进行响应式系统的重写, 代替Object.defineProperty, 减少数组删除新增等方法的重写, 对象修改方法的重写, 代码量更少.更加灵活

4. typescript支持: vue3对ts的支持更好, 提供了更好的类型定义和工具支持, 使得ts开发vue3更加便捷

5. vue3优化了tree shaking: 使得打包后的体积更小,性能更好.vue3的构建工具可以更好地除去未使用的代码

6. 性能优化: 
渲染优化: 使用更高效地渲染算法
内存管理: 改进了内存管理降低了内存泄漏的可能性
依赖追踪: 改进了依赖追踪机制,使得更新更加可信


7. API变更: 选项式API -> 组合式API  引入一些新的生命周期钩子: onMounted onUpdated onUnMounted