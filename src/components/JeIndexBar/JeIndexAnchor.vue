<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { jeIndexBarKey } from './types'

defineOptions({ name: 'JeIndexAnchor' })

const props = defineProps<{
  /** 对应索引栏里的索引值 */
  index: string | number
}>()

const bar = inject(jeIndexBarKey, null)
const anchorRef = ref<HTMLElement | null>(null)

const isActive = computed(() => bar !== null && bar.active.value === props.index)

/** 只有当前锚点命中时才吸顶，否则头部会一直黏在容器上 */
const headerStyle = computed(() => {
  if (!bar || !bar.sticky.value || !isActive.value) return undefined
  return {
    position: 'sticky' as const,
    top: `${bar.stickyOffsetTop.value}px`,
    zIndex: 1,
  }
})

const register = () => {
  bar?.register({ index: props.index, getEl: () => anchorRef.value })
}

const onHeaderClick = () => {
  bar?.select(props.index)
}

onMounted(register)
onBeforeUnmount(() => bar?.unregister(props.index))

watch(
  () => props.index,
  (value, prev) => {
    if (prev !== undefined) bar?.unregister(prev)
    if (bar) bar.register({ index: value, getEl: () => anchorRef.value })
  },
)
</script>

<template>
  <div ref="anchorRef" class="je-index-anchor">
    <div class="je-index-anchor__header" :style="headerStyle" @click="onHeaderClick">
      <slot name="index">{{ index }}</slot>
    </div>
    <div class="je-index-anchor__content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.je-index-anchor {
  font-family: inherit;
}

.je-index-anchor__header {
  box-sizing: border-box;
  padding: 6px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--je-text-muted);
  cursor: pointer;
  background: var(--je-surface-hover);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.je-index-anchor__content {
  background: transparent;
}
</style>
