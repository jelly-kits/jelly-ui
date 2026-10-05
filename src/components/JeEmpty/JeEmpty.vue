<script setup lang="ts">
import type { JeEmptyImageSlotProps } from './types'

defineOptions({ name: 'JeEmpty' })

withDefaults(
  defineProps<{
    /** 描述文案 */
    description?: string
    /** 默认插画尺寸（px） */
    imageSize?: number
  }>(),
  { description: '暂无数据', imageSize: 100 },
)

defineSlots<{
  /** 自定义插画，作用域参数带建议尺寸 */
  default?: (props: JeEmptyImageSlotProps) => unknown
  /** 自定义描述文案 */
  description?: () => unknown
  /** 操作区，通常放一个按钮 */
  extra?: () => unknown
}>()
</script>

<template>
  <div class="je-empty">
    <div class="je-empty__image" :style="{ width: `${imageSize}px`, height: `${imageSize}px` }">
      <slot :size="imageSize">
        <!-- 自绘内联插画：一个打开的纸箱，不依赖任何外链图片 -->
        <svg
          class="je-empty__svg"
          viewBox="0 0 120 120"
          width="100%"
          height="100%"
          fill="none"
          role="img"
          aria-label="暂无数据"
        >
          <ellipse class="je-empty__shadow" cx="60" cy="102" rx="32" ry="6" />
          <path class="je-empty__box" d="M24 50h72l-7 44a6 6 0 0 1-5.9 5H36.9A6 6 0 0 1 31 94Z" />
          <path
            class="je-empty__lid"
            d="M20 34a6 6 0 0 1 6-6h68a6 6 0 0 1 6 6v10a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6Z"
          />
          <path class="je-empty__line" d="M48 62h24" />
        </svg>
      </slot>
    </div>

    <div v-if="description || $slots.description" class="je-empty__description">
      <slot name="description">{{ description }}</slot>
    </div>

    <div v-if="$slots.extra" class="je-empty__extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<style scoped>
.je-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  box-sizing: border-box;
  padding: 32px 16px;
  font-family: inherit;
  text-align: center;
}

.je-empty__image {
  flex-shrink: 0;
}

.je-empty__svg {
  display: block;
  width: 100%;
  height: 100%;
  animation: je-empty-float 3.2s ease-in-out infinite;
}

/* 插画配色全部由主色现算 */
.je-empty__shadow {
  fill: color-mix(in srgb, var(--je-primary) 12%, transparent);
}

.je-empty__box {
  fill: color-mix(in srgb, var(--je-primary) 10%, transparent);
  stroke: color-mix(in srgb, var(--je-primary) 45%, transparent);
  stroke-width: 2;
  stroke-linejoin: round;
}

.je-empty__lid {
  fill: color-mix(in srgb, var(--je-primary) 22%, transparent);
  stroke: color-mix(in srgb, var(--je-primary) 55%, transparent);
  stroke-width: 2;
  stroke-linejoin: round;
}

.je-empty__line {
  stroke: color-mix(in srgb, var(--je-primary) 45%, transparent);
  stroke-width: 2;
  stroke-linecap: round;
}

.je-empty__description {
  margin-top: 14px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--je-text-faint);
}

.je-empty__extra {
  margin-top: 18px;
}

@keyframes je-empty-float {
  50% {
    transform: translateY(-5px);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-empty__svg {
    animation: none;
  }
}
</style>
