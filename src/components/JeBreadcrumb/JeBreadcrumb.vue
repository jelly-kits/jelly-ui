<script setup lang="ts">
import { provide, ref } from 'vue'
import type { JeIconName } from '../JeIcon/icons'
import { jeBreadcrumbKey, type JeBreadcrumbContext } from './types'

defineOptions({ name: 'JeBreadcrumb' })

const props = withDefaults(
  defineProps<{
    separator?: string
    separatorIcon?: JeIconName
  }>(),
  { separator: '/', separatorIcon: undefined },
)

/** 子项 uid 的顺序表，用于判断最后一项 */
const items = ref<string[]>([])

const context: JeBreadcrumbContext = {
  getSeparator: () => props.separator,
  getSeparatorIcon: () => props.separatorIcon,
  isLast: (uid) => items.value.length > 0 && items.value[items.value.length - 1] === uid,
  registerItem: (uid) => {
    if (items.value.includes(uid)) return
    items.value = [...items.value, uid]
  },
  unregisterItem: (uid) => {
    items.value = items.value.filter((item) => item !== uid)
  },
}
provide(jeBreadcrumbKey, context)
</script>

<template>
  <nav class="je-breadcrumb" aria-label="面包屑">
    <ol class="je-breadcrumb__list">
      <slot />
    </ol>
  </nav>
</template>

<style scoped>
.je-breadcrumb {
  box-sizing: border-box;
  font-family: inherit;
  font-size: 14px;
  color: var(--je-text-muted);
}

.je-breadcrumb__list {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (max-width: 768px) {
  /* 窄屏不换行，整条横向滑动，项本身不收缩 */
  .je-breadcrumb {
    max-width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
  }

  .je-breadcrumb::-webkit-scrollbar {
    display: none;
  }

  .je-breadcrumb__list {
    flex-wrap: nowrap;
  }
}
</style>
