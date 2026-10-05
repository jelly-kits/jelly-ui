<script setup lang="ts">
import { computed } from 'vue'
import type { JeSkeletonVariant } from './types'

defineOptions({ name: 'JeSkeletonItem' })

const props = withDefaults(
  defineProps<{
    /** 形态：text 文本行 / circle 圆形 / rect 矩形 / button 按钮 */
    variant?: JeSkeletonVariant
    /** 宽度，数字按 px 处理 */
    width?: string | number
    /** 高度，数字按 px 处理 */
    height?: string | number
  }>(),
  { variant: 'text' },
)

/** 各形态的默认尺寸 */
const DEFAULTS: Record<JeSkeletonVariant, { width: string | number; height: string | number }> = {
  text: { width: '100%', height: 14 },
  circle: { width: 40, height: 40 },
  rect: { width: '100%', height: 48 },
  button: { width: 80, height: 32 },
}

const style = computed(() => {
  const fallback = DEFAULTS[props.variant]
  const width = props.width ?? fallback.width
  const height = props.height ?? fallback.height
  return {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }
})
</script>

<template>
  <span
    class="je-skeleton__item"
    :class="`je-skeleton__item--${variant}`"
    :style="style"
    aria-hidden="true"
  />
</template>

<style scoped>
.je-skeleton__item {
  display: block;
  flex-shrink: 0;
  border-radius: 6px;
  /* 微光扫过：底色比表面略亮一点，形成流动的高光带 */
  background: linear-gradient(
    90deg,
    var(--je-surface) 25%,
    var(--je-surface-hover) 37%,
    var(--je-surface) 63%
  );
  background-size: 400% 100%;
  animation: je-skeleton-shimmer 1.4s ease infinite;
}

.je-skeleton__item--rect {
  border-radius: var(--je-radius);
}

.je-skeleton__item--circle {
  border-radius: 50%;
}

.je-skeleton__item--button {
  border-radius: var(--je-radius-sm);
}

@keyframes je-skeleton-shimmer {
  from {
    background-position: 100% 0;
  }

  to {
    background-position: 0 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-skeleton__item {
    animation: none;
  }
}
</style>
