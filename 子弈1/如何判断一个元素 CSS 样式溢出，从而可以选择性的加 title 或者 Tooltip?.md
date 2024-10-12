# 如何判断一个元素 CSS 样式溢出，从而可以选择性的加 title 或者 Tooltip?

判断元素的el.offsetWidth < el.scrollWith就是元素溢出

# 如何让 CSS 元素左侧自动溢出（... 溢出在左侧）？

```
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Left Overflow Example</title>
<style>
  .left-overflow {
    position: relative;
    width: 200px;
    overflow: hidden;
    white-space: nowrap;
  }

  .left-overflow::before {
    content: attr(data-text);
    direction: rtl;
    text-align: right;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
</style>
</head>
<body>
  <div class="left-overflow" data-text="这是一个很长的文字，可能会超出元素的边界。">
    这是一个很长的文字，可能会超出元素的边界。
  </div>
</body>
</html>
```