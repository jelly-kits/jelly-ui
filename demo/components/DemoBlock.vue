<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { JeScrollbar } from '@jelly-kits/jelly-ui'
import { DEMO_PAGE_KEY, buildDemoCode } from './demoCode'
import { useDemoI18n } from '../i18n'

const props = defineProps<{ title?: string; description?: string }>()

/** 中文原文即 key，未收录回落中文（见 demo/i18n/index.ts） */
const { t } = useDemoI18n()

const page = inject(DEMO_PAGE_KEY, null)
/** 序号必须在 setup 期取，才能和页面上演示块的渲染顺序对齐 */
const blockIndex = page ? page.nextIndex() : -1
/** 标题的锚点 id，右侧本页目录按它跳转；没有标题的块不进目录 */
const anchorId = blockIndex >= 0 && props.title ? `demo-block-${blockIndex}` : ''

onMounted(() => {
  if (page && anchorId) {
    page.registerAnchor({ id: anchorId, title: props.title ?? '', order: blockIndex })
  }
})

onBeforeUnmount(() => {
  if (page && anchorId) page.unregisterAnchor(anchorId)
})

const code = computed(() => {
  const source = page?.source.value
  return source && blockIndex >= 0 ? buildDemoCode(source, blockIndex) : ''
})

const opened = ref(false)
const copied = ref(false)
let timer = 0

const copy = async () => {
  const text = code.value
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // 非安全上下文（如 http 访问）下 clipboard 不可用，退回临时 textarea
    const area = document.createElement('textarea')
    area.value = text
    area.style.position = 'fixed'
    area.style.opacity = '0'
    document.body.appendChild(area)
    area.select()
    document.execCommand('copy')
    document.body.removeChild(area)
  }
  copied.value = true
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = false
  }, 1500)
}
</script>

<template>
  <section class="demo-block">
    <h3 v-if="title" :id="anchorId || undefined" class="demo-block__title">{{ t(title) }}</h3>
    <p v-if="description" class="demo-block__desc">{{ t(description) }}</p>
    <div class="demo-block__body">
      <slot />
    </div>

    <div v-if="code" class="demo-block__code">
      <div class="demo-block__bar">
        <button
          type="button"
          class="demo-block__toggle"
          :aria-expanded="opened"
          @click="opened = !opened"
        >
          <span class="demo-block__chevron" aria-hidden="true" />
          {{ t(opened ? '收起代码' : '展开代码') }}
        </button>
        <button type="button" class="demo-block__copy" @click="copy">
          {{ t(copied ? '已复制' : '复制') }}
        </button>
      </div>

      <div v-show="opened" class="demo-block__panel">
        <je-scrollbar class="demo-block__scroll" max-height="420px">
          <pre class="demo-block__pre"><code>{{ code }}</code></pre>
        </je-scrollbar>
      </div>
    </div>
  </section>
</template>

<style scoped>
.demo-block {
  margin-bottom: 36px;
}

.demo-block__title {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--je-text);
}

.demo-block__desc {
  margin: 0 0 14px;
  font-size: 13px;
  line-height: 1.6;
  color: var(--je-text-faint);
}

.demo-block__body {
  padding: 22px;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius-lg);
}

.demo-block__body :deep(> * + *) {
  margin-top: 16px;
}

.demo-block__code {
  margin-top: 12px;
  /* 比 .demo-block__body 的 --je-surface 再深/亮一档，明暗两套主题都成立 */
  background: color-mix(in srgb, var(--je-text) 12%, transparent);
  border: var(--je-border);
  border-radius: var(--je-radius);
  overflow: hidden;
}

.demo-block__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 6px 8px 6px 14px;
}

.demo-block__toggle,
.demo-block__copy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  font: inherit;
  font-size: 12px;
  color: var(--je-text-muted);
  background: none;
  border: none;
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  transition: color 0.2s ease, background 0.2s ease;
}

.demo-block__toggle:hover,
.demo-block__copy:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.demo-block__copy {
  font-weight: 600;
  /* 与正文色混合：浅色主题下偏深、深色主题下偏亮，一套规则吃两套主题 */
  color: color-mix(in srgb, var(--je-primary) 55%, var(--je-text));
}

/* 用两条边框拼一个 chevron：展开时翻到朝上 */
.demo-block__chevron {
  width: 7px;
  height: 7px;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg) translate(-1px, -1px);
  transition: transform 0.3s var(--je-ease-out-back);
}

.demo-block__toggle[aria-expanded='true'] .demo-block__chevron {
  transform: rotate(-135deg) translate(-1px, -1px);
}

/* 收起时整块 display:none，不留半截代码；展开时给个入场动画示意 */
.demo-block__panel {
  animation: demo-block-code-in 0.28s var(--je-ease-out-back);
}

@keyframes demo-block-code-in {
  from {
    opacity: 0;
    transform: translateY(-6px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 边框留在滚动容器上：放进 pre 里会跟着内容滚走 */
.demo-block__scroll {
  border-top: var(--je-border);
}

.demo-block__pre {
  margin: 0;
  padding: 14px 16px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 12.5px;
  line-height: 1.7;
  color: color-mix(in srgb, var(--je-primary) 22%, var(--je-text));
}

@media (prefers-reduced-motion: reduce) {
  .demo-block__panel {
    animation: none;
  }

  .demo-block__chevron {
    transition: none;
  }
}
</style>
