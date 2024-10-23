# 骨架屏(skeleton)
使用element-ui或者element-plus的skeleton组件即可。

# Loading
1. 微前端主页面在子页面加载完成之前, 子页面上覆盖一层loading, 加载完成取消loading
2. axios或者基础请求中, 当开始请求时, 页面顶部显示一个小loading, 请求成功或失败后取消loading


# 缓存

1. 客户端缓存: 页面刷新时统一请求缓存接口,返回接口名称:已更新数据的键值对, 如果某个接口有更新那么拿到最新的数据更新到页面并保存到localstorage, 其他接口从localstorage中取数据渲染页面

2. 服务器端缓存: 高频操作例如IM未读数等存到redis中, 提高访问速度

3. HTTP缓存: 利用HTTP的缓存机制, 如ETag和cache-control


# 错误降级

1. vue3错误边界, script setup 父组件中调用errorCaptured中return false防止错误传播
```javascript
<template>
  <div>
    <h1>错误边界示例</h1>
    <button @click="resetError">重置错误</button>
    <p v-if="hasError">发生了错误：{{ error.message }}</p>
    <RiskyComponent v-if="!hasError" />
  </div>
</template>

<script setup>
import { ref, defineComponent } from 'vue';
import RiskComponent from './RiskyComponent.vue';

const hasError = ref(false);
const error = ref(null);

const resetError = () => {
  has.value = false;
  error.value = null;
};

// 使用 errorCaptured 处理错误
const errorCaptured = (err) => {
  hasError.value = true;
  error.value = err;
  return false; // 返回 以阻止继续传播错误
};

defineComponent({
  errorCaptured,
});
</script>

```

# 请求重试

1. 基础请求接口,如果失败重试三次, 三次都失败则报错

```javascript
function retryFetch(url, maxRetries = 3) {
    return fetch(url)
        .catch(error => {
            if (maxRetries > 0) {
                return retryFetch(url, maxRetries - 1);
            } else {
                throw error;
            }
        });
}
```