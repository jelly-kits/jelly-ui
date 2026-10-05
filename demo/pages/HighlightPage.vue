<script setup lang="ts">
import { ref } from 'vue'
import { JeHighlight, JeInput } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const text = 'Jelly UI 是一套基于 Vue 3 的组件库，Jelly 的取名来自「果冻」，希望组件交互像果冻一样有弹性。'

const single = ref('Jelly')
const multiple = ref(['Vue', '组件库'])
const query = ref('组件')
</script>

<template>
  <DemoPage
    title="Highlight 关键字高亮"
    description="把源文本按关键字切分并高亮命中的片段，支持多关键字、大小写敏感与自定义标签 / 类名。"
  >
    <DemoBlock title="基础用法" description="keywords 传入单个关键字，命中的片段套上默认高亮样式。">
      <je-highlight :text="text" :keywords="single" />
      <p class="hint">当前关键字：{{ single }}</p>
    </DemoBlock>

    <DemoBlock
      title="多个关键字与大小写"
      description="keywords 传数组可同时高亮多个词，长关键字优先匹配；caseSensitive 控制是否区分大小写。"
    >
      <je-highlight :text="text" :keywords="multiple" />
      <div class="gap" />
      <p class="label">区分大小写（关键字 jelly，全部不命中）</p>
      <je-highlight :text="text" keywords="jelly" case-sensitive />
      <div class="gap" />
      <p class="label">不区分大小写（默认）</p>
      <je-highlight :text="text" keywords="jelly" />
    </DemoBlock>

    <DemoBlock
      title="自定义标签与样式"
      description="highlightTag / unhighlightTag 替换包裹标签，highlightClass 覆盖默认高亮样式，tag 决定最外层标签。"
    >
      <je-highlight
        :text="text"
        keywords="Jelly"
        tag="p"
        highlight-tag="mark"
        highlight-class="je-demo-mark"
      />
      <p class="hint">命中片段用了 &lt;mark&gt; 标签，背景与内边距由 highlightClass 定义。</p>
    </DemoBlock>

    <DemoBlock title="实时高亮搜索" description="把输入框的值直接作为 keywords，输入即时重算分段结果。">
      <je-input v-model="query" type="search" placeholder="输入关键字试试" />
      <div class="gap" />
      <je-highlight :text="text" :keywords="query" />
      <p class="hint">当前关键字：{{ query || '（空）' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 14px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}

.label {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--je-text-muted);
}

.gap {
  height: 14px;
}

/* 子元素由 JeHighlight 内部渲染，作用域样式需要 :deep 才能命中 */
:deep(.je-demo-mark) {
  padding: 1px 6px;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 40%, transparent);
  border-radius: var(--je-radius-sm);
}
</style>