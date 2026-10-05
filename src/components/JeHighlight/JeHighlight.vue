<script setup lang="ts">
import { computed } from 'vue'
import type { JeHighlightSegment } from './types'

defineOptions({ name: 'JeHighlight' })

const props = withDefaults(
  defineProps<{
    /** 源文本 */
    text?: string
    /** 需要高亮的关键字，支持单个或多个 */
    keywords?: string | string[]
    /** 大小写敏感 */
    caseSensitive?: boolean
    /** 命中片段的类名 */
    highlightClass?: string
    /** 未命中片段的类名 */
    unhighlightClass?: string
    /** 命中片段的标签名 */
    highlightTag?: string
    /** 未命中片段的标签名 */
    unhighlightTag?: string
    /** 对关键字做正则转义 */
    autoEscape?: boolean
    /** 最外层标签名 */
    tag?: string
  }>(),
  {
    text: '',
    keywords: () => [] as string[],
    caseSensitive: false,
    highlightClass: undefined,
    unhighlightClass: undefined,
    highlightTag: 'span',
    unhighlightTag: 'span',
    autoEscape: true,
    tag: 'span',
  },
)

const ESCAPE_RE = /[.*+?^${}()|[\]\\]/g

const escapeRegExp = (value: string) => value.replace(ESCAPE_RE, '\\$&')

/** 归一化：过滤空关键字（否则正则会多出空分支），长关键字优先以免被短词切碎 */
const patterns = computed(() => {
  const raw = Array.isArray(props.keywords) ? props.keywords : [props.keywords]
  return raw
    .filter((item): item is string => typeof item === 'string' && item.length > 0)
    .sort((a, b) => b.length - a.length)
    .map((item) => (props.autoEscape ? escapeRegExp(item) : item))
})

/** 用带捕获组的 split 切分：偶数下标是普通文本，奇数下标是命中片段 */
const segments = computed<JeHighlightSegment[]>(() => {
  const source = props.text ?? ''
  if (!source || patterns.value.length === 0) {
    return [{ text: source, matched: false }]
  }
  const flags = props.caseSensitive ? '' : 'i'
  const matcher = new RegExp(`(${patterns.value.join('|')})`, flags)
  return source
    .split(matcher)
    .map((part, index) => ({ text: part, matched: index % 2 === 1 }))
    .filter((segment) => segment.text !== '')
})

defineExpose({ segments })
</script>

<template>
  <component :is="tag" class="je-highlight">
    <component
      v-for="(segment, index) in segments"
      :key="index"
      :is="segment.matched ? highlightTag : unhighlightTag"
      :class="[
        segment.matched ? 'je-highlight__matched' : '',
        segment.matched ? highlightClass : unhighlightClass,
      ]"
    >{{ segment.text }}</component>
  </component>
</template>

<style scoped>
.je-highlight__matched {
  font-weight: 600;
  color: var(--je-primary);
}
</style>