1. 确保项目中有.d.ts文件, 并配置tsconfig.json以支持javascript文件编译和类型检查
2. 获取类型定义文件
```
npm install @types/lodash
# 或者使用 yarn
yarn add @types/lodash
```
3. 配置tsconfig.json
```
{
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "typeRoots": ["./node_modules/@types"], // 指定类型声明文件的位置
    "types": ["lodash"], // 指定一组类型

  }
}
```
4. 如何ts无法正确解析模块路径,可以调整
```
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```