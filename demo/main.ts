// 全局 CSS token：库的入口不再自带这行（否则类型声明会带悬空引用），
// 消费端必须自己引一次样式 —— 文档站这里就按消费端的方式显式引入
import '../src/theme/variables.css'
import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'

createApp(App).use(router).mount('#app')