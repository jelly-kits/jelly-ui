<script setup lang="ts">
import { ref } from 'vue'
import { JeLazyload } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

/**
 * 演示用图片：仓库内置的静态插画（`public/images/*.svg`），不依赖任何外部图片服务。
 * 路径带上 `import.meta.env.BASE_URL` —— 脚本里的字符串不会被 Vite 按 base 改写，
 * 部署到 Pages 子路径时缺了前缀会 404。
 */
const images = [
  `${import.meta.env.BASE_URL}images/living-room.svg`,
  `${import.meta.env.BASE_URL}images/vegetables.svg`,
  `${import.meta.env.BASE_URL}images/mountain-lake.svg`,
]

const loaded = ref(0)

const onLoad = () => {
  loaded.value += 1
}
</script>

<template>
  <DemoPage
    title="Lazyload 图片懒加载"
    description="基于 IntersectionObserver 的图片懒加载，进入视口才发起请求，未加载时展示骨架屏占位。"
  >
    <DemoBlock title="基础用法" description="向下滚动，图片进入视口后才会加载，加载前后分别是骨架屏与图片。">
      <div class="grid">
        <je-lazyload
          v-for="(src, index) in images"
          :key="index"
          :src="src"
          :alt="`示例图 ${index + 1}`"
          :height="160"
          class="cell"
          @load="onLoad"
        />
      </div>
      <p class="hint">已加载 {{ loaded }} 张</p>
    </DemoBlock>

    <DemoBlock title="指定宽高与填充方式" description="width / height 传数字按 px 处理，objectFit 控制裁剪方式。">
      <div class="grid">
        <je-lazyload :src="images[0]" :width="180" :height="180" object-fit="cover" />
        <je-lazyload :src="images[1]" :width="180" :height="180" object-fit="contain" />
      </div>
    </DemoBlock>

    <DemoBlock title="立即加载" description="loading=eager 跳过低加载，挂载后直接请求。">
      <je-lazyload :src="images[2]" loading="eager" :height="160" />
    </DemoBlock>

    <DemoBlock title="加载失败与兜底图" description="src 无效时展示「加载失败」，配置 error 则先切到兜底图。">
      <div class="grid">
        <je-lazyload src="/not-exist.png" :height="140" />
        <je-lazyload src="/not-exist.png" :error="images[0]" :height="140" />
      </div>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.grid {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cell {
  flex: 1 1 220px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
