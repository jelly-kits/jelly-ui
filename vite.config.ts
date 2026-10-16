import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 更具体的子路径必须写在前面：别名是「先匹配先命中」，
      // 反过来会被 '@jelly-kits/jelly-ui' 抢走，解析成 src/index.ts/editor 这种不存在的路径
      '@jelly-kits/jelly-ui/editor': fileURLToPath(new URL('./src/editor.ts', import.meta.url)),
      '@jelly-kits/jelly-ui/sortable': fileURLToPath(new URL('./src/sortable.ts', import.meta.url)),
      '@jelly-kits/jelly-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    // public/ 是文档站自己的静态资源（logo、favicon），没必要跟着组件库发出去
    copyPublicDir: false,
    lib: {
      // 四个入口：index 出 JS 与类型声明；style 只负责把全局 CSS token 拉进依赖图（产出 dist/style.css）；
      // editor 是富文本编辑器的独立入口，它依赖 @tiptap/*；sortable 是拖拽排序的独立入口，它依赖 sortablejs。
      // 这两个包都记为「可选 peer」—— 并进 index 会让没用到它们的用户也被要求安装。
      // index 拆出 CSS 入口的另一个原因见 src/style.ts。
      entry: {
        'jelly-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        style: fileURLToPath(new URL('./src/style.ts', import.meta.url)),
        editor: fileURLToPath(new URL('./src/editor.ts', import.meta.url)),
        sortable: fileURLToPath(new URL('./src/sortable.ts', import.meta.url)),
      },
      name: 'JeUI',
      formats: ['es', 'cjs'],
      // 多入口时 fileName 会按入口逐个调用，必须带上 entryName 区分，否则四个入口同名互相覆盖
      fileName: (format, entryName) => `${entryName}.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      // vue、@tiptap/* 与 sortablejs 都不打进产物：消费者自己提供（后两者见 package.json 的 optional peer）
      external: (id) => id === 'vue' || id.startsWith('@tiptap/') || id.startsWith('sortablejs'),
      // 具名导出 + 插件 default 导出并存，显式声明 named 以免 rollup 提示「混用导出」
      output: { globals: { vue: 'Vue' }, exports: 'named' },
    },
  },
})