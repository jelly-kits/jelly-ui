import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@jelly-kits/jelly-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    // public/ 是文档站自己的静态资源（logo、favicon），没必要跟着组件库发出去
    copyPublicDir: false,
    lib: {
      // 两个入口：index 出 JS 与类型声明；style 只负责把全局 CSS token 拉进依赖图（产出 dist/style.css）。
      // 拆开的唯一原因是 src/index.ts 一旦导入 CSS，那行 import 会被原样写进 dist/index.d.ts；
      // 该悬空引用对默认配置的消费端无害，但开了 noUncheckedSideEffectImports 会报 TS2307（详见 src/style.ts）。
      entry: {
        'jelly-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        style: fileURLToPath(new URL('./src/style.ts', import.meta.url)),
      },
      name: 'JeUI',
      formats: ['es', 'cjs'],
      // 多入口时 fileName 会按入口逐个调用，必须带上 entryName 区分，否则两个入口同名互相覆盖
      fileName: (format, entryName) => {
        const ext = format === 'es' ? 'js' : 'cjs'
        return `${entryName === 'style' ? 'style' : 'jelly-ui'}.${ext}`
      },
    },
    rollupOptions: {
      external: ['vue'],
      // 具名导出 + 插件 default 导出并存，显式声明 named 以免 rollup 提示「混用导出」
      output: { globals: { vue: 'Vue' }, exports: 'named' },
    },
  },
})