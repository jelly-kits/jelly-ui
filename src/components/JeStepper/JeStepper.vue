<script setup lang="ts">
import { computed, getCurrentInstance, onBeforeUnmount, ref, watch } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useJeConfigSize } from '../JeConfigProvider/types'

defineOptions({ name: 'JeStepper' })

const props = withDefaults(
  defineProps<{
    /** 当前值 */
    modelValue?: number
    /** 允许的最小值 */
    min?: number
    /** 允许的最大值 */
    max?: number
    /** 每次加减的步长 */
    step?: number
    /** 只允许整数 */
    integer?: boolean
    /** 固定小数位数；不传则按 step 推导 */
    decimalLength?: number
    disabled?: boolean
    /** 禁用中间的输入框，只能点按钮 */
    disableInput?: boolean
    /** 输入框宽度 */
    inputWidth?: number | string
    /** 加减按钮的尺寸 */
    buttonSize?: number
    /**
     * 变更前的拦截钩子，返回 false（或 resolve false）则不更新。
     * 支持异步，便于先弹确认框再决定是否改动。
     */
    beforeChange?: (next: number, current: number) => boolean | Promise<boolean>
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: 'small' | 'default' | 'large'
  }>(),
  {
    modelValue: 1,
    min: 1,
    max: Infinity,
    step: 1,
    integer: false,
    decimalLength: undefined,
    disabled: false,
    disableInput: false,
    inputWidth: 48,
    buttonSize: 32,
    beforeChange: undefined,
    size: undefined,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
  /** 值真正变化后触发 */
  change: [value: number]
  /** 已到边界再继续加减、或手动输入超限时触发 */
  overlimit: [type: 'plus' | 'minus']
}>()

const decimalsOf = (value: number) => {
  const text = String(value)
  const dot = text.indexOf('.')
  return dot < 0 ? 0 : text.length - dot - 1
}

const precision = computed(() => props.decimalLength ?? (props.integer ? 0 : decimalsOf(props.step)))

const round = (value: number) => {
  const factor = 10 ** precision.value
  return Math.round(value * factor) / factor
}

const clamp = (value: number) => Math.min(props.max, Math.max(props.min, value))

const current = computed(() => props.modelValue)

/** 输入框里展示的文本，固定小数位时补零 */
const displayValue = computed(() =>
  props.decimalLength === undefined ? String(current.value) : current.value.toFixed(props.decimalLength),
)

const atMin = computed(() => current.value <= props.min)
const atMax = computed(() => current.value >= props.max)

const inputValue = ref('')

watch(displayValue, (value) => {
  inputValue.value = value
}, { immediate: true })

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-stepper--${size.value}`))

/** 加减按钮图标随尺寸缩放（default 14 为原值） */
const ICON_SIZE: Record<'small' | 'default' | 'large', number> = { small: 12, default: 14, large: 16 }
const iconSize = computed(() => ICON_SIZE[size.value])

/*
 * inputWidth / buttonSize 只在调用方显式传了的时候才写内联变量：
 * 内联样式的优先级高于 CSS 类，若无条件写入就会把 size 档位的类覆盖掉，
 * 导致这两个尺寸永远钉死在默认值上（兼容 input-width 这类 kebab-case 写法）。
 */
const instance = getCurrentInstance()
const isProvided = (name: string) => {
  const raw = instance?.vnode.props
  if (!raw) return false
  const kebab = name.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)
  return name in raw || kebab in raw
}

const rootStyle = computed(() => {
  const style: Record<string, string> = {}
  if (isProvided('buttonSize')) style['--je-stepper-btn'] = `${props.buttonSize}px`
  if (isProvided('inputWidth')) {
    style['--je-stepper-input-w'] =
      typeof props.inputWidth === 'number' ? `${props.inputWidth}px` : props.inputWidth
  }
  return style
})

/** 还原输入框显示（拦截 / 无效输入时用） */
const restore = () => {
  inputValue.value = displayValue.value
}

const apply = async (next: number) => {
  const target = round(clamp(next))
  if (target === current.value) {
    restore()
    return
  }
  if (props.beforeChange) {
    const allowed = await props.beforeChange(target, current.value)
    if (!allowed) {
      restore()
      return
    }
  }
  emit('update:modelValue', target)
  emit('change', target)
}

const stepBy = (direction: 1 | -1) => {
  if (props.disabled) return
  const next = round(current.value + direction * props.step)
  if (next > props.max) {
    emit('overlimit', 'plus')
    return
  }
  if (next < props.min) {
    emit('overlimit', 'minus')
    return
  }
  void apply(next)
}

const commit = () => {
  const raw = inputValue.value.trim()
  if (raw === '') {
    restore()
    return
  }
  const parsed = Number(raw)
  if (Number.isNaN(parsed)) {
    restore()
    return
  }
  if (parsed > props.max) emit('overlimit', 'plus')
  else if (parsed < props.min) emit('overlimit', 'minus')
  void apply(parsed)
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

/* 长按连续步进：500ms 后进入 100ms 一次的连发 */
let delayTimer = 0
let repeatTimer = 0

const stopRepeat = () => {
  window.clearTimeout(delayTimer)
  window.clearInterval(repeatTimer)
  delayTimer = 0
  repeatTimer = 0
}

const onPressStart = (direction: 1 | -1) => {
  if (props.disabled) return
  stepBy(direction)
  stopRepeat()
  delayTimer = window.setTimeout(() => {
    repeatTimer = window.setInterval(() => stepBy(direction), 100)
  }, 500)
}

onBeforeUnmount(stopRepeat)
</script>

<template>
  <div
    class="je-stepper"
    :class="[sizeClass, { 'is-disabled': disabled }]"
    :style="rootStyle"
  >
    <button
      type="button"
      class="je-stepper__btn"
      :disabled="disabled || atMin"
      aria-label="减少"
      @pointerdown="onPressStart(-1)"
      @pointerup="stopRepeat"
      @pointerleave="stopRepeat"
      @pointercancel="stopRepeat"
      @contextmenu.prevent
    >
      <JeIcon name="minus" :size="iconSize" />
    </button>

    <input
      class="je-stepper__input"
      type="text"
      inputmode="decimal"
      autocomplete="off"
      :value="inputValue"
      :disabled="disabled || disableInput"
      role="spinbutton"
      :aria-valuenow="current"
      :aria-valuemin="min === -Infinity ? undefined : min"
      :aria-valuemax="max === Infinity ? undefined : max"
      @input="inputValue = ($event.target as HTMLInputElement).value"
      @blur="commit"
      @keydown="onKeydown"
    >

    <button
      type="button"
      class="je-stepper__btn"
      :disabled="disabled || atMax"
      aria-label="增加"
      @pointerdown="onPressStart(1)"
      @pointerup="stopRepeat"
      @pointerleave="stopRepeat"
      @pointercancel="stopRepeat"
      @contextmenu.prevent
    >
      <JeIcon name="plus" :size="iconSize" />
    </button>
  </div>
</template>

<style scoped>
.je-stepper {
  display: inline-flex;
  align-items: center;
  font-family: inherit;
  /* 尺寸变量：default 为基础值，修饰类只覆盖这几个变量 */
  --je-stepper-btn: 26px;
  --je-stepper-input-w: 40px;
  --je-stepper-fs: var(--je-control-fs);
  --je-stepper-radius: var(--je-control-radius);
}

.je-stepper--small {
  --je-stepper-btn: 22px;
  --je-stepper-input-w: 34px;
  --je-stepper-fs: var(--je-control-fs-sm);
  --je-stepper-radius: var(--je-control-radius-sm);
}

.je-stepper--large {
  --je-stepper-btn: 32px;
  --je-stepper-input-w: 48px;
  --je-stepper-fs: var(--je-control-fs-lg);
  --je-stepper-radius: var(--je-control-radius-lg);
}

.je-stepper__btn {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--je-stepper-btn);
  height: var(--je-stepper-btn);
  color: var(--je-text);
  cursor: pointer;
  background: var(--je-surface);
  border: 1.5px solid var(--je-border-color);
  border-radius: var(--je-stepper-radius);
  outline: none;
  /* 长按连发时不要让浏览器把触摸当成滚动 */
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  transition: background var(--je-duration) ease, border-color var(--je-duration) ease,
    transform 0.12s ease;
}

.je-stepper__btn:hover:not(:disabled) {
  border-color: var(--je-primary);
}

.je-stepper__btn:not(:disabled):active {
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
  transform: scale(0.94);
}

.je-stepper__btn:focus-visible {
  border-color: var(--je-primary);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--je-primary) 30%, transparent);
}

.je-stepper__btn:disabled {
  cursor: not-allowed;
  opacity: 0.4;
}

.je-stepper__input {
  width: var(--je-stepper-input-w);
  margin: 0 8px;
  padding: 0;
  font-family: inherit;
  font-size: var(--je-stepper-fs, 14px);
  font-variant-numeric: tabular-nums;
  color: var(--je-text);
  text-align: center;
  background: none;
  border: none;
  outline: none;
}

.je-stepper__input:disabled {
  cursor: default;
  color: var(--je-text-muted);
}

.je-stepper.is-disabled {
  opacity: 0.6;
}

@media (max-width: 768px) {
  /* 触屏档：加减按钮与输入框同一条三档（32 / 44 / 50），档位在窄屏同样生效 */
  .je-stepper {
    --je-stepper-btn: var(--je-touch-h);
    --je-stepper-input-w: var(--je-touch-h);
    --je-stepper-fs: var(--je-touch-fs);
  }

  .je-stepper--small {
    --je-stepper-btn: var(--je-touch-h-sm);
    --je-stepper-input-w: var(--je-touch-h-sm);
    --je-stepper-fs: var(--je-touch-fs-sm);
  }

  .je-stepper--large {
    --je-stepper-btn: var(--je-touch-h-lg);
    --je-stepper-input-w: var(--je-touch-h-lg);
    --je-stepper-fs: var(--je-touch-fs-lg);
  }
}
</style>
