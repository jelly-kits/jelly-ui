<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { JeButton, JeLoading, JeSpace, showLoading } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const inline = ref(false)
const fullscreen = ref(false)

const timers: number[] = []
const later = (fn: () => void, delay = 1500) => {
  timers.push(window.setTimeout(fn, delay))
}

const showInline = () => {
  inline.value = true
  later(() => {
    inline.value = false
  })
}

const showFullscreen = () => {
  fullscreen.value = true
  later(() => {
    fullscreen.value = false
  })
}

/** 命令式实例：不经过模板，直接挂到 body */
let instance: { close: () => void } | null = null

const showImperative = () => {
  closeImperative()
  instance = showLoading({ text: '正在提交…' })
  later(closeImperative)
}

const closeImperative = () => {
  instance?.close()
  instance = null
}

onBeforeUnmount(() => {
  timers.forEach((id) => window.clearTimeout(id))
  instance?.close()
  instance = null
})
</script>

<template>
  <DemoPage
    title="Loading 加载"
    description="转圈由内联 SVG 圆环自绘。组件式用于局部遮罩，命令式 showLoading 会挂到 body 做全屏覆盖。"
  >
    <DemoBlock
      title="局部遮罩"
      description="默认插槽是被遮罩的内容，loading 为 true 时覆盖其上。命令式 API 名为 showLoading，与标签名 Loading / je-loading 不重名，模板写 kebab 或 PascalCase 均可。"
    >
      <je-loading :loading="inline" text="加载中…">
        <div class="panel">这里是一块内容区域，加载时会盖上半透明遮罩。</div>
      </je-loading>
      <je-button @click="showInline">开始加载</je-button>
    </DemoBlock>

    <DemoBlock title="全屏加载" description="fullscreen 时遮罩传送到 body，覆盖整个视口并预留安全区。">
      <je-button @click="showFullscreen">全屏加载 1.5 秒</je-button>
      <je-loading :loading="fullscreen" fullscreen text="正在处理，请稍候…" />
    </DemoBlock>

    <DemoBlock title="命令式调用" description="showLoading() 返回 { close }，无需在模板里声明组件。">
      <je-space>
        <je-button @click="showImperative">命令式全屏加载</je-button>
        <je-button variant="ghost" @click="closeImperative">立即关闭</je-button>
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.panel {
  padding: 28px 20px;
  font-size: 14px;
  color: var(--je-text-muted);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
}
</style>
