import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

/*
 * 文档站构建：与组件的库构建分开。
 *
 * vite.config.ts 走的是 build.lib，根 index.html（文档站入口）在库模式下会被忽略 ——
 * 同一份配置没法既是「库」又是「站点」，所以文档站单独一份。
 * 产物落在 dist-demo/，与 dist/ 互不干扰。
 *
 * 部署到子路径时（如 GitHub Pages 的 /jelly-ui/）用命令行覆盖 base：
 *   npm run build:demo -- --base=/jelly-ui/
 */

/** 兼容 / 与 \（Rollup 的 id 在 Windows 上也可能带反斜杠） */
const inDir = (id: string, dir: string) => new RegExp(`[/\\\\]${dir}[/\\\\]`).test(id)

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@jelly-kits/jelly-ui': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist-demo',
    emptyOutDir: true,
    /*
     * Vite 默认在「压缩后 >500KB」时告警，这里上调到 600KB。
     * 不是为了掩盖告警：600KB（压缩后）按实测比例约合压缩前 1MB ——
     * 正好是下面那条 esbuild 阈值，涨到这条线附近就该继续拆包了。
     */
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        /*
         * 拆包，且刻意让**每一块压缩前都小于 1MB**。
         *
         * 硬约束来自 esbuild 0.21：单次 transform 的 payload ≥ 1MB 时它会改用「临时文件中转」，
         * 而在部分机器（实测本机）的系统 %TEMP% 下，那个中转文件回收必然失败，
         * 报 `[vite:esbuild-transpile] remove C:\...\Temp\esbuild-xxxx: Access is denied.` 后整个构建中断。
         * 整站不拆时主 chunk 压缩前有 2.7MB，稳定触发；拆成下面几块后每块都在阈值以下，压缩 / 降级都正常。
         *
         * 分包本身也是合理的：框架 / 组件库 / API 表数据 / 演示页源码各自独立，
         * 改一页文档不会让其它块的缓存整体失效。
         * ⚠️ 任何一块压缩前涨到 1MB 以上都会重新踩到这个 esbuild 问题，届时继续细分。
         */
        manualChunks(id) {
          if (id.includes('node_modules')) return 'vendor'
          if (inDir(id, 'src')) return 'jelly'
          if (id.includes('api-data')) return 'api'
          // DemoPage 用 import.meta.glob 额外读了一份页面源码（id 形如 XxxPage.vue?raw），
          // 单这一份就约 680KB，和页面组件挤在一起必然顶破 1MB，所以单独成块。
          // 它只被 demo 块引用，不构成循环块。
          if (id.includes('?raw')) return 'sources'
          if (inDir(id, 'demo')) return 'demo'
        },
      },
    },
  },
})
