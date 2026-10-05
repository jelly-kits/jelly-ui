<script setup lang="ts">
import { ref } from 'vue'
import { JeIcon, JeSpace, jeIcons, type JeIconName } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const names = Object.keys(jeIcons) as JeIconName[]

/** 刚操作过的图标名，用于把名字临时换成复制结果 */
const copied = ref('')
const copyFailed = ref(false)
let timer = 0

const usageOf = (name: JeIconName) => `<je-icon name="${name}" :size="22" />`

/**
 * 复制到剪贴板：优先异步 API；http 等非安全上下文下它不可用，退回临时 textarea。
 *
 * 两条路都要兜住异常，而且异步 API 还必须是「有时限」的：文档没有获得焦点时
 * （比如自动化环境、或用户点了别处再点图标）writeText 会一直挂着不 resolve，
 * 那样后面的反馈代码永远不执行，用户看到的就是「点了没反应」。
 */
const writeClipboard = async (text: string) => {
  try {
    await Promise.race([
      navigator.clipboard.writeText(text),
      new Promise((_, reject) => {
        window.setTimeout(() => reject(new Error('clipboard timeout')), 500)
      }),
    ])
    return true
  } catch {
    try {
      const area = document.createElement('textarea')
      area.value = text
      area.style.position = 'fixed'
      area.style.opacity = '0'
      document.body.appendChild(area)
      area.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(area)
      return ok
    } catch {
      return false
    }
  }
}

const copy = async (name: JeIconName) => {
  const ok = await writeClipboard(usageOf(name))
  copyFailed.value = !ok
  copied.value = name
  window.clearTimeout(timer)
  timer = window.setTimeout(() => {
    copied.value = ''
  }, 1500)
}
</script>

<template>
  <DemoPage
    title="Icon 图标"
    description="零依赖自绘 SVG 图标集，统一 24×24 视图盒，颜色跟随 currentColor。点击任意图标即可复制它的用法代码。"
  >
    <DemoBlock
      title="全部图标"
      description="点击任意图标即可复制它的用法代码（形如 je-icon name=&quot;search&quot; :size=&quot;22&quot;），被点击的那个名字会短暂变成「已复制」。"
    >
      <div class="icons">
        <button
          v-for="name in names"
          :key="name"
          type="button"
          class="icons__item"
          :class="{ 'is-copied': copied === name, 'is-failed': copied === name && copyFailed }"
          :title="usageOf(name)"
          :aria-label="`复制 ${name} 的用法`"
          @click="copy(name)"
        >
          <je-icon :name="name" :size="22" />
          <span class="icons__name">
            {{ copied === name ? (copyFailed ? '复制失败' : '已复制') : name }}
          </span>
        </button>
      </div>
    </DemoBlock>

    <DemoBlock title="旋转与填充">
      <je-space :size="20">
        <je-icon name="loading" :size="22" spin />
        <je-icon name="refresh" :size="22" />
        <je-icon name="star" :size="22" filled style="color: var(--je-warning)" />
      </je-space>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.icons {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(96px, 1fr));
  gap: 12px;
}

/*
 * 图标格子本身就是按钮，所以这里要把浏览器默认的按钮样式全部抹平，
 * 否则不同平台会带上各自的边框 / 字体 / 内边距。
 */
.icons__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
  padding: 12px 6px;
  font: inherit;
  color: var(--je-text);
  cursor: pointer;
  background: var(--je-surface);
  border: 1.5px solid transparent;
  border-radius: var(--je-radius-sm);
  outline: none;
  transition: background 0.2s ease, border-color 0.2s ease,
    transform 0.2s var(--je-ease-out-back);
}

.icons__item:hover {
  background: var(--je-surface-hover);
  transform: translateY(-2px);
}

.icons__item:focus-visible {
  border-color: var(--je-primary);
}

.icons__item.is-copied {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 22%, transparent);
}

/* 复制失败时用语义色区分，避免把「没复制上」显示成成功 */
.icons__item.is-failed {
  border-color: var(--je-danger);
  background: color-mix(in srgb, var(--je-danger) 20%, transparent);
}

.icons__name {
  font-size: 11px;
  color: var(--je-text-faint);
  text-align: center;
  word-break: break-all;
}

.icons__item.is-copied .icons__name {
  font-weight: 600;
  color: var(--je-text);
}
</style>
