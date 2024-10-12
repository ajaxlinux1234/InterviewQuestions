# 如何实现一个上中下三行布局，顶部和底部最小高度是 100px，中间自适应?

## 方案1:flex
```
.box{
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}
.top, .bottom {
  min-height: 100px;
  background: blue;
}

.middle {
  flex: 1;
  background: yellow;
}
```

## 方案2:grid
```
.box {
  height: 100vh;
  width: 100vw;
  display: grid;
  grid-template-row: minmax(100px, 1fr) 1fr minmax(100px,1fr);
}

.top,.bottom {
  background: blue;
}

.middle {
  background: yellow;
}
```
