<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useId } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { jeBreadcrumbKey } from './types'

defineOptions({ name: 'JeBreadcrumbItem' })

const props = withDefaults(
  defineProps<{
    to?: string
    /** 跳转时替换当前历史记录（仅在提供 to 时生效） */
    replace?: boolean
  }>(),
  { to: '', replace: false },
)

const context = inject(jeBreadcrumbKey)
const uid = useId()

context?.registerItem(uid)
onBeforeUnmount(() => context?.unregisterItem(uid))

const last = computed(() => context?.isLast(uid) ?? false)
const separatorIcon = computed<JeIconName | undefined>(() => context?.getSeparatorIcon())
const separatorText = computed(() => context?.getSeparator() ?? '/')

const onClick = (event: MouseEvent) => {
  if (!props.to || !props.replace) return
  // 组件库不依赖 vue-router，replace 用原生 location.replace 实现
  event.preventDefault()
  window.location.replace(props.to)
}
</script>

<template>
  <li class="je-breadcrumb-item" :class="{ 'is-last': last }">
    <a
      v-if="to"
      class="je-breadcrumb-item__link"
      :href="to"
      :aria-current="last ? 'page' : undefined"
      @click="onClick"
    >
      <slot />
    </a>
    <span v-else class="je-breadcrumb-item__text" :aria-current="last ? 'page' : undefined">
      <slot />
    </span>

    <span v-if="!last" class="je-breadcrumb-item__separator" aria-hidden="true">
      <JeIcon v-if="separatorIcon" :name="separatorIcon" :size="14" />
      <template v-else>{{ separatorText }}</template>
    </span>
  </li>
</template>

<style scoped>
.je-breadcrumb-item {
  display: inline-flex;
  flex-shrink: 0;
  gap: 8px;
  align-items: center;
  white-space: nowrap;
}

.je-breadcrumb-item__link,
.je-breadcrumb-item__text {
  color: inherit;
  text-decoration: none;
  border-radius: 6px;
  outline: none;
  transition: color var(--je-duration) ease;
}

.je-breadcrumb-item__link:hover {
  color: var(--je-text);
}

.je-breadcrumb-item__link:focus-visible,
.je-breadcrumb-item__text:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 3px;
}

/* 最后一项不可点、颜色更淡 */
.je-breadcrumb-item.is-last {
  color: var(--je-text-faint);
}

.je-breadcrumb-item__separator {
  display: inline-flex;
  align-items: center;
  color: var(--je-text-faint);
  user-select: none;
}

@media (max-width: 768px) {
  .je-breadcrumb-item {
    gap: 6px;
    min-height: 44px;
  }

  .je-breadcrumb-item__link,
  .je-breadcrumb-item__text {
    display: inline-flex;
    align-items: center;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-breadcrumb-item__link,
  .je-breadcrumb-item__text {
    transition: none;
  }
}
</style>
