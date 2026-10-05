<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

defineOptions({ name: 'JeActionBar' })

const props = withDefaults(
  defineProps<{
    /** 固定在视口底部 */
    fixed?: boolean
    /** fixed 时用占位元素撑住原高度，避免遮挡页面底部内容 */
    placeholder?: boolean
    /** 底部预留安全区（全面屏手势条） */
    safeAreaInsetBottom?: boolean
    /** 顶部 1px 分隔线 */
    border?: boolean
    /** fixed 时的层级 */
    zIndex?: number
  }>(),
  {
    fixed: false,
    placeholder: true,
    safeAreaInsetBottom: true,
    border: true,
    zIndex: 100,
  },
)

const barRef = ref<HTMLElement | null>(null)
const barHeight = ref(0)

const rootStyle = computed(() => {
  const style: Record<string, string> = {
    '--je-action-bar-height': `${barHeight.value}px`,
    '--je-action-bar-safe-bottom': props.safeAreaInsetBottom
      ? 'env(safe-area-inset-bottom, 0px)'
      : '0px',
  }
  if (props.fixed) style['--je-action-bar-z'] = String(props.zIndex)
  return style
})

let observer: ResizeObserver | null = null
const syncHeight = () => {
  barHeight.value = barRef.value?.offsetHeight ?? 0
}

onMounted(() => {
  syncHeight()
  if (typeof ResizeObserver !== 'undefined' && barRef.value) {
    observer = new ResizeObserver(syncHeight)
    observer.observe(barRef.value)
  }
})

onBeforeUnmount(() => {
  observer?.disconnect()
  observer = null
})
</script>

<template>
  <div class="je-action-bar" :style="rootStyle">
    <div
      ref="barRef"
      class="je-action-bar__inner"
      :class="{ 'is-fixed': fixed, 'has-border': border }"
    >
      <slot />
    </div>

    <div v-if="fixed && placeholder" class="je-action-bar__placeholder" aria-hidden="true" />
  </div>
</template>

<style scoped>
.je-action-bar {
  font-family: inherit;
  color: var(--je-text);
  --je-action-bar-height: 0px;
  --je-action-bar-safe-bottom: 0px;
}

.je-action-bar__inner {
  display: flex;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-height: 50px;
  padding: 6px 12px;
  padding-bottom: calc(6px + var(--je-action-bar-safe-bottom));
  background: var(--je-popup);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.je-action-bar__inner.has-border {
  border-top: var(--je-border);
}

.je-action-bar__inner.is-fixed {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: var(--je-action-bar-z, 100);
}

/* 占位高度必须与操作栏一致（含安全区），否则固定后会盖住内容 */
.je-action-bar__placeholder {
  height: var(--je-action-bar-height);
}

@media (max-width: 768px) {
  .je-action-bar__inner {
    gap: 6px;
    padding: 6px 10px;
    padding-bottom: calc(6px + var(--je-action-bar-safe-bottom));
  }
}
</style>