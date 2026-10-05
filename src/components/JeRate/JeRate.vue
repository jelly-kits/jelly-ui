<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeIcon } from '../JeIcon'

defineOptions({ name: 'JeRate' })

const props = withDefaults(
  defineProps<{
    modelValue?: number
    max?: number
    /** 允许半星 */
    allowHalf?: boolean
    /** 再次点击当前分值可清零 */
    clearable?: boolean
    disabled?: boolean
    /** 星星尺寸，不传则用主题默认值（窄屏会自动放大） */
    size?: number
  }>(),
  { modelValue: 0, max: 5, allowHalf: false, clearable: false, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const rootRef = ref<HTMLElement | null>(null)
/** 鼠标悬停时的预览值，离开即清空 */
const hoverValue = ref<number | null>(null)

const stepSize = computed(() => (props.allowHalf ? 0.5 : 1))
const displayValue = computed(() => hoverValue.value ?? props.modelValue)
const fillWidth = computed(() => `${(displayValue.value / props.max) * 100}%`)

const sizeStyle = computed(() =>
  props.size == null ? undefined : { '--je-rate-size': `${props.size}px` },
)

const valueFromEvent = (event: PointerEvent) => {
  const el = rootRef.value
  if (!el) return stepSize.value
  const rect = el.getBoundingClientRect()
  if (rect.width === 0) return stepSize.value
  const ratio = ((event.clientX - rect.left) / rect.width) * props.max
  const value = Math.ceil(ratio / stepSize.value) * stepSize.value
  return Math.min(props.max, Math.max(stepSize.value, value))
}

const commit = (value: number) => {
  const next = props.clearable && value === props.modelValue ? 0 : value
  if (next !== props.modelValue) emit('update:modelValue', next)
}

const onPointerDown = (event: PointerEvent) => {
  if (props.disabled) return
  commit(valueFromEvent(event))
}

const onPointerMove = (event: PointerEvent) => {
  if (props.disabled) return
  // 触屏没有悬停预览，只在鼠标上做预览
  if (event.pointerType === 'mouse') hoverValue.value = valueFromEvent(event)
}

const onPointerLeave = () => {
  hoverValue.value = null
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  const commit2 = (value: number) => {
    event.preventDefault()
    commit(Math.min(props.max, Math.max(0, value)))
  }
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowUp':
      commit2(props.modelValue + stepSize.value)
      break
    case 'ArrowLeft':
    case 'ArrowDown':
      commit2(props.modelValue - stepSize.value)
      break
    case 'Home':
      commit2(stepSize.value)
      break
    case 'End':
      commit2(props.max)
      break
  }
}
</script>

<template>
  <div
    ref="rootRef"
    class="je-rate"
    :class="{ 'is-disabled': disabled }"
    :style="sizeStyle"
    role="slider"
    :tabindex="disabled ? -1 : 0"
    aria-label="评分"
    aria-valuemin="0"
    :aria-valuemax="max"
    :aria-valuenow="modelValue"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerleave="onPointerLeave"
    @keydown="onKeydown"
  >
    <div class="je-rate__layer je-rate__layer--void" aria-hidden="true">
      <span v-for="n in max" :key="`void-${n}`" class="je-rate__star">
        <JeIcon name="star" filled />
      </span>
    </div>

    <div class="je-rate__layer je-rate__layer--fill" :style="{ width: fillWidth }" aria-hidden="true">
      <span v-for="n in max" :key="`fill-${n}`" class="je-rate__star">
        <JeIcon name="star" filled />
      </span>
    </div>
  </div>
</template>

<style scoped>
.je-rate {
  --je-rate-size: 28px;

  position: relative;
  display: inline-flex;
  padding: 8px 0;
  cursor: pointer;
  outline: none;
  user-select: none;
}

.je-rate__layer {
  display: flex;
}

/* 填充层盖在空星上，用宽度裁切实现整星 / 半星 */
.je-rate__layer--fill {
  position: absolute;
  top: 8px;
  left: 0;
  overflow: hidden;
  color: var(--je-warning);
}

.je-rate__layer--void {
  color: var(--je-text-faint);
}

.je-rate__star {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  width: var(--je-rate-size);
  height: 44px;
}

/* 图标尺寸交给 CSS 变量统一控制，才能被窄屏媒体查询放大 */
.je-rate__star :deep(svg) {
  width: var(--je-rate-size);
  height: var(--je-rate-size);
}

.je-rate:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 3px;
  border-radius: 8px;
}

.je-rate.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 窄屏放大星星，保证触控热区 */
@media (max-width: 768px) {
  .je-rate {
    --je-rate-size: 34px;
  }
}
</style>