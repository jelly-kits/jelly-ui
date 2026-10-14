<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { JeIcon } from '../JeIcon'
import { useJeConfigSize } from '../JeConfigProvider/types'

defineOptions({ name: 'JeInputNumber' })

const props = withDefaults(
  defineProps<{
    modelValue?: number | null
    min?: number
    max?: number
    step?: number
    /** 小数位数，不传则由 step 推导 */
    precision?: number
    placeholder?: string
    disabled?: boolean
    /** 是否显示加减按钮 */
    controls?: boolean
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: 'small' | 'default' | 'large'
  }>(),
  {
    modelValue: null,
    min: -Infinity,
    max: Infinity,
    step: 1,
    placeholder: '',
    disabled: false,
    controls: true,
    size: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-number--${size.value}`))

/** 加减按钮图标随尺寸缩放 */
const ICON_SIZE: Record<'small' | 'default' | 'large', number> = { small: 12, default: 14, large: 16 }
const iconSize = computed(() => ICON_SIZE[size.value])

const decimalsOf = (value: number) => {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

const stepPrecision = computed(() => props.precision ?? decimalsOf(props.step))

const round = (value: number) => {
  const factor = 10 ** stepPrecision.value
  return Math.round(value * factor) / factor
}

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value))

const inputValue = ref('')

watch(
  () => props.modelValue,
  (value) => {
    inputValue.value = value === null || value === undefined ? '' : String(value)
  },
  { immediate: true },
)

const assign = (value: number | null) => {
  inputValue.value = value === null ? '' : String(value)
  if (value !== props.modelValue) emit('update:modelValue', value)
}

const commit = () => {
  const raw = inputValue.value.trim()
  if (raw === '') {
    assign(null)
    return
  }
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) {
    assign(props.modelValue ?? null)
    return
  }
  assign(round(clamp(parsed)))
}

const stepBy = (direction: number) => {
  if (props.disabled) return
  const base = typeof props.modelValue === 'number' ? props.modelValue : 0
  assign(round(clamp(base + direction * props.step)))
}

const onKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    event.preventDefault()
    commit()
    return
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    stepBy(1)
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    stepBy(-1)
  }
}

const atMin = computed(() => typeof props.modelValue === 'number' && props.modelValue <= props.min)
const atMax = computed(() => typeof props.modelValue === 'number' && props.modelValue >= props.max)
</script>

<template>
  <div
    class="je-number"
    :class="[sizeClass, { 'is-disabled': disabled, 'has-controls': controls }]"
  >
    <button
      v-if="controls"
      type="button"
      class="je-number__btn"
      :disabled="disabled || atMin"
      aria-label="减少"
      @click="stepBy(-1)"
    >
      <JeIcon name="minus" :size="iconSize" />
    </button>

    <input
      class="je-number__input"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :value="inputValue"
      :placeholder="placeholder"
      :disabled="disabled"
      role="spinbutton"
      :aria-valuenow="typeof modelValue === 'number' ? modelValue : undefined"
      :aria-valuemin="min === -Infinity ? undefined : min"
      :aria-valuemax="max === Infinity ? undefined : max"
      @input="inputValue = ($event.target as HTMLInputElement).value"
      @blur="commit"
      @keydown="onKeydown"
    >

    <button
      v-if="controls"
      type="button"
      class="je-number__btn"
      :disabled="disabled || atMax"
      aria-label="增加"
      @click="stepBy(1)"
    >
      <JeIcon name="plus" :size="iconSize" />
    </button>
  </div>
</template>

<style scoped>
.je-number {
  /* default 档直接引用全局控件 token，small / large 只覆盖这几个变量 */
  --jn-h: var(--je-control-h);
  --jn-input-fs: var(--je-control-fs);
  --jn-btn-w: 36px;
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  height: var(--jn-h);
  overflow: hidden;
  background: var(--je-surface);
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-control-radius);
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-number--small {
  --jn-h: var(--je-control-h-sm);
  --jn-input-fs: var(--je-control-fs-sm);
  --jn-btn-w: 30px;
}

.je-number--large {
  --jn-h: var(--je-control-h-lg);
  --jn-input-fs: var(--je-control-fs-lg);
  --jn-btn-w: 44px;
}

.je-number:focus-within {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-number__input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0 12px;
  font-family: inherit;
  font-size: var(--jn-input-fs, var(--je-control-fs));
  color: var(--je-text);
  text-align: center;
  background: none;
  border: none;
  outline: none;
}

.je-number__input::placeholder {
  color: var(--je-text-faint);
}

.je-number__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--jn-btn-w, 44px);
  font-family: inherit;
  font-size: 16px;
  color: var(--je-text-muted);
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.je-number__btn:hover:not(:disabled) {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-number__btn:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -3px;
}

.je-number__btn:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.je-number.is-disabled .je-number__input {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 窄屏：与 input / select / button 同一套触屏档，保证同一表单行内等高 */
@media (max-width: 768px) {
  .je-number {
    --jn-h: var(--je-touch-h);
    --jn-btn-w: 48px;
    /* 字号取触屏档与 16px 的较大值：低于 16px 时 iOS 聚焦会自动放大页面 */
    --jn-input-fs: max(16px, var(--je-touch-fs));
  }

  .je-number--small {
    --jn-h: var(--je-touch-h-sm);
    --jn-btn-w: 44px;
    --jn-input-fs: max(16px, var(--je-touch-fs-sm));
  }

  .je-number--large {
    --jn-h: var(--je-touch-h-lg);
    --jn-btn-w: 52px;
    --jn-input-fs: max(16px, var(--je-touch-fs-lg));
  }

  .je-number__input {
    padding: 0 10px;
  }
}
</style>