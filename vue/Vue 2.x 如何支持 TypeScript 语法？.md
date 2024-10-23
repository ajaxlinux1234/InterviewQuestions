1. 安装ts,@types/vue: vue的ts类型定义,vue-class-component:vue class组件的定义库,vue-property-decorator: vue组件类的装饰器库

2. 配置tsconfig.json和babel.config.js

```javascript
module.exports = {
  presets: [
    '@vue/cli-plugin-babel/preset'
  ],
  plugins: [
    '@babel/plugin-transform-typescript'
  ]
};
```

3. 配置vue-cli

```javascript
module.exports = {
  // ...
  module: {
    rules: [
      // ...
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.vue', '.json']
  }
};
```