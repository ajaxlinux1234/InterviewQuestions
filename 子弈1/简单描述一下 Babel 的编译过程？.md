# 简单描述一下 Babel 的编译过程？
Babel 是一个 JavaScript 的编译器，它将 ES6+ 的代码转换为 ES5 的代码，以便在老版本的浏览器中运行。以下是 Babel 的编译过程：
1. **预处理（Parsing）**：Babel 首先将输入的代码解析为 AST（抽象语法树）。
2. **转换（Transform）**：Babel 使用一系列的插件（Plugins）来转换 AST。这些插件可以包括语法转换、代码优化等。
3. **生成（Generation）**：转换后的 AST 再次被解析为 JavaScript 代码。