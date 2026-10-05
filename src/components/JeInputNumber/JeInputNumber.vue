<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { JeIcon } from '../JeIcon'

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
  }>(),
  {
    modelValue: null,
    min: -Infinity,
    max: Infinity,
    step: 1,
    placeholder: '',
    disabled: false,
    controls: true,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: number | null] }>()

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
    :class="{ 'is-disabled': disabled, 'has-controls': controls }"
  >
    <button
      v-if="controls"
      type="button"
      class="je-number__btn"
      :disabled="disabled || atMin"
      aria-label="减少"
      @click="stepBy(-1)"
    >
      <JeIcon name="minus" :size="14" />
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
      <JeIcon name="plus" :size="14" />
    </button>
  </div>
</template>

<style scoped>
.je-number {
  display: flex;
  align-items: stretch;
  box-sizing: border-box;
  overflow: hidden;
  background: var(--je-surface);
  border: 1.5px solid var(--je-border-color);
  border-radius: var(--je-radius);
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

.je-number:focus-within {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-number__input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 14px 12px;
  font-family: inherit;
  font-size: 15px;
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
  width: 44px;
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

/* 窄屏放大热区，保证单指点击不误触 */
@media (max-width: 768px) {
  .je-number__input {
    padding: 15px 10px;
  }

  .je-number__btn {
    width: 48px;
  }
}
</style>