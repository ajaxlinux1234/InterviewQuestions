# compilerOptions: compilerOptions是一个对象.包含了Typescript编译器的各种选项.例如

1. target: 编辑目标类型, 如es5, es6, esnext
2. module: 模块系统类型, 如commonjs,amd,esnext
3. lib: 指定要包含的类型库
4. outDir: 指定输出目录
5. rootDirs: 根目录,用于多文件路径映射
6. baseUrl: 基础路径,用于路径别名
7. paths: 路径映射, 用于设置路径别名
8. sourceMap: 是否生成sourceMap文件
9. strict: 启用严格的类型检查选项
10. esModuleInterop: 启用Commonjs兼容模式
11. jsx: 指定jsx代码的处理方式. preserver: 输出的文件保留jsx以供后续操作. react: 会生成React.createElement, 在使用前不需要转换操作了,输出的扩展名为.jsx. react-native: 相当于preserver,保留jsx,但是输出的扩展为.js
12. resolveJsonModule: 运行导入JSON模块
13. allowJs: 允许编译js文件
14. checkJs: 对js文件启动类型检查
15. noEmit: 不生成输出文件
16. skipLibCheck: 跳过类型库文件的类型检查
17. forceConsistentCasingInFileNames: 强制文件名大小写统一
18. "composite": true, 为true表示在ts项目中可以引入其他项目
19. extends: 继承另一个tsconfig.json配置项,避免重复

# includes 指定哪些文件和文件夹包含在编译过程中
```
{
  includes: [
    'src/**/*/',
    "src/**/*.d.ts",
		"src/**/*.vue",
		"components.d.ts",
		"auto-imports.d.ts",
		"src/**/*.js"
  ]
}
```

# excludes 指定哪些文件或文件夹应该排除在编译之外

```
 {
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

# files 指定编译过程的具体文件列表
```
{
  "files": [
    "src/app.ts",
    "src/utils.ts"
  ]
}
```

# references 引用其他Typescript项目

```
{
  "references": [
    { "path": "./other-project" }
  ]
}
```


