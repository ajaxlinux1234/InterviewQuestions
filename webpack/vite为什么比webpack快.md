1. vite基于浏览器本身的ES Modules进行热更新,每次只更新改动的模块, 而不是webpack那种一点改动重新分析整个依赖树, 更新速度大大提高

2. vite使用原生模块加载 , 可以立即加载和执行新编译的模块, 无需等待整个应用重载. 而webpack热更新需要把更新结果发送到客户端, 客户端再进行处理, 整个过程比较慢, 通过import.meta来拿到模块的元数据, 例如模块名称,版本, 模块url
```javascript
<script type="module">
  import { feature } from './module.js';
</script>
```
3. vite对动态的import异步加载模块的支持性更好