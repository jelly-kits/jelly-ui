<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  ref,
  useAttrs,
  useSlots,
  watch,
  type Component,
  type StyleValue,
} from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import { useJeConfig } from '../JeConfigProvider/types'
import type { JeIconName } from '../JeIcon/icons'
import type { JeInputProps, JeInputResize, JeInputTextareaStyle } from './types'

defineOptions({ name: 'JeInput', inheritAttrs: false })

const props = withDefaults(defineProps<JeInputProps>(), {
  modelValue: '',
  type: 'text',
  placeholder: '',
  showWordLimit: false,
  wordLimitPosition: 'inside',
  clearable: false,
  clearIcon: 'close',
  showPassword: false,
  disabled: false,
  readonly: false,
  rows: 2,
  autosize: false,
  autocomplete: 'off',
  autofocus: false,
  validateEvent: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  input: [value: string]
  change: [value: string, evt?: Event]
  clear: [evt?: MouseEvent]
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
  keydown: [event: KeyboardEvent]
  mouseenter: [event: MouseEvent]
  mouseleave: [event: MouseEvent]
  compositionstart: [event: CompositionEvent]
  compositionupdate: [event: CompositionEvent]
  compositionend: [event: CompositionEvent]
}>()

const attrs = useAttrs()
const slots = useSlots()
const config = useJeConfig()

const inputRef = ref<HTMLInputElement | null>(null)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

const isFocused = ref(false)
const passwordVisible = ref(false)
const isComposing = ref(false)
const textareaStyle = ref<JeInputTextareaStyle>({})

/* ---------------------------------------------------------------- 尺寸与结构 */

const size = computed(() => props.size ?? config.size.value)
const isTextarea = computed(() => props.type === 'textarea')
const hasGroup = computed(() => Boolean(slots.prepend || slots.append))

/**
 * 根节点始终是 .je-input-group，但没有前置 / 后置插槽时用 display: contents 把盒子摘掉，
 * 这样 .je-input 就是实际参与布局的元素——与改造前「根节点就是输入框」的用法保持一致。
 */
const groupClasses = computed(() => ({
  'is-grouped': hasGroup.value,
  'has-prepend': Boolean(slots.prepend),
  'has-append': Boolean(slots.append),
}))

/* ------------------------------------------------------------ 属性透传的拆分 */

/** class / style 留在可见的输入框外框上，其余（role、aria-*、name…）落到内部原生控件 */
const userClass = computed(() => attrs.class)
const userStyle = computed(() => attrs.style as StyleValue)
const innerAttrs = computed(() => {
  const rest: Record<string, unknown> = { ...attrs }
  delete rest.class
  delete rest.style
  return rest
})

/* -------------------------------------------------------------- 值与显示同步 */

const nativeValue = computed(() =>
  props.modelValue === undefined || props.modelValue === null ? '' : String(props.modelValue),
)

/** 显示值：formatter 只作用于「看到什么」，v-model 里始终是 parser 解析后的真实值 */
const displayValue = computed(() =>
  props.formatter ? props.formatter(props.modelValue ?? '') : nativeValue.value,
)

const element = (): HTMLInputElement | HTMLTextAreaElement | null =>
  inputRef.value ?? textareaRef.value

/**
 * 把显示值写回原生控件。只在真的要变时才赋值——值相同就不碰 DOM，
 * 浏览器会因此保留光标位置，输入过程不会被格式化打断。
 */
const setNativeInputValue = () => {
  const el = element()
  if (!el || isComposing.value) return
  if (el.value !== displayValue.value) el.value = displayValue.value
}

/* ---------------------------------------------------------------- 字形簇计数 */

interface SegmenterLike {
  segment: (input: string) => Iterable<string>
}

let segmenterCache: SegmenterLike | null | undefined

/** Intl.Segmenter 能正确切分 emoji / 组合字符，老浏览器退回码点切分 */
const getSegmenter = (): SegmenterLike | null => {
  if (segmenterCache !== undefined) return segmenterCache
  segmenterCache = null
  if (typeof Intl !== 'undefined') {
    const ctor = (
      Intl as unknown as {
        Segmenter?: new (locales?: string, options?: { granularity?: string }) => SegmenterLike
      }
    ).Segmenter
    if (ctor) {
      try {
        segmenterCache = new ctor(undefined, { granularity: 'grapheme' })
      } catch {
        segmenterCache = null
      }
    }
  }
  return segmenterCache
}

const splitGraphemes = (value: string): string[] => {
  const segmenter = getSegmenter()
  return segmenter ? Array.from(segmenter.segment(value)) : Array.from(value)
}

const textLength = computed(() =>
  props.countGraphemes ? props.countGraphemes(nativeValue.value) : splitGraphemes(nativeValue.value).length,
)

/**
 * 传了 countGraphemes 时原生 maxlength 不再生效（计数口径交给调用方），
 * 上限只由下方的计数器提示，不会悄悄截断用户输入。
 */
const nativeMaxlength = computed(() => (props.countGraphemes ? undefined : props.maxlength))
const nativeMinlength = computed(() => (props.countGraphemes ? undefined : props.minlength))

const isWordLimitVisible = computed(
  () =>
    props.showWordLimit &&
    (props.type === 'text' || isTextarea.value) &&
    !props.disabled &&
    !props.readonly,
)

const wordLimitText = computed(() =>
  props.maxlength === undefined ? String(textLength.value) : `${textLength.value} / ${props.maxlength}`,
)

const isOverLimit = computed(
  () => props.maxlength !== undefined && textLength.value > Number(props.maxlength),
)

/* -------------------------------------------------------------- 清空 / 密码 */

const hasValue = computed(() => nativeValue.value.length > 0)

const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && hasValue.value,
)

const showPwdVisible = computed(
  () =>
    props.showPassword &&
    props.type === 'password' &&
    !props.disabled &&
    !props.readonly &&
    hasValue.value,
)

const effectiveType = computed(() => {
  if (props.type !== 'password' || !props.showPassword) return props.type
  return passwordVisible.value ? 'text' : 'password'
})

/* -------------------------------------------------------------------- 图标 */

const asIconName = (icon: unknown): JeIconName | undefined =>
  typeof icon === 'string' ? (icon as JeIconName) : undefined
const asIconComponent = (icon: unknown): Component | undefined =>
  typeof icon === 'string' ? undefined : (icon as Component | undefined)

const prefixIconName = computed(() => asIconName(props.prefixIcon))
const prefixIconComponent = computed(() => asIconComponent(props.prefixIcon))
const suffixIconName = computed(() => asIconName(props.suffixIcon))
const suffixIconComponent = computed(() => asIconComponent(props.suffixIcon))
const clearIconName = computed(() => asIconName(props.clearIcon))
const clearIconComponent = computed(() => asIconComponent(props.clearIcon))

const showPrefix = computed(() =>
  Boolean(prefixIconName.value || prefixIconComponent.value || slots.prefix),
)
const showSuffix = computed(() =>
  Boolean(suffixIconName.value || suffixIconComponent.value || slots.suffix),
)
const showCountInside = computed(
  () => isWordLimitVisible.value && props.wordLimitPosition === 'inside',
)
const hasSuffixArea = computed(
  () => showSuffix.value || showPwdVisible.value || showClear.value || showCountInside.value,
)

/* ------------------------------------------------------------------ 文本域 */

const resizeStyle = computed<{ resize?: JeInputResize } | undefined>(() =>
  props.resize ? { resize: props.resize } : undefined,
)

/** 自适应高度：临时把 height 放开量一次 scrollHeight，再按 minRows / maxRows 收敛 */
const resizeTextarea = () => {
  if (!isTextarea.value) return
  const el = textareaRef.value
  if (!el) return
  if (!props.autosize) {
    textareaStyle.value = {}
    return
  }

  const computedStyle = window.getComputedStyle(el)
  const fontSize = Number.parseFloat(computedStyle.fontSize) || 15
  const lineHeight = Number.parseFloat(computedStyle.lineHeight) || fontSize * 1.5
  const padding =
    (Number.parseFloat(computedStyle.paddingTop) || 0) +
    (Number.parseFloat(computedStyle.paddingBottom) || 0)
  const border =
    (Number.parseFloat(computedStyle.borderTopWidth) || 0) +
    (Number.parseFloat(computedStyle.borderBottomWidth) || 0)
  const options = typeof props.autosize === 'object' ? props.autosize : {}

  const previous = el.style.height
  el.style.height = 'auto'
  const content = el.scrollHeight
  el.style.height = previous

  let height = content + border
  let overflowY: JeInputTextareaStyle['overflowY'] = 'hidden'

  if (options.minRows) {
    const min = lineHeight * options.minRows + padding + border
    if (height < min) height = min
  }
  if (options.maxRows) {
    const max = height > 0 ? lineHeight * options.maxRows + padding + border : 0
    if (max > 0 && height > max) {
      height = max
      overflowY = 'auto'
    }
  }

  textareaStyle.value = { height: `${Math.ceil(height)}px`, overflowY }
}

/* -------------------------------------------------------------------- 事件 */

const onInput = (event: Event) => {
  if (isComposing.value) return
  const el = event.target as HTMLInputElement | HTMLTextAreaElement
  const raw = el.value
  const next = props.parser ? props.parser(raw) : raw

  emit('update:modelValue', next)
  emit('input', next)

  void nextTick(() => {
    setNativeInputValue()
    resizeTextarea()
  })
}

const onChange = (event: Event) => {
  const el = event.target as HTMLInputElement | HTMLTextAreaElement
  emit('change', props.parser ? props.parser(el.value) : el.value, event)
}

const onFocus = (event: FocusEvent) => {
  isFocused.value = true
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  isFocused.value = false
  // 失焦时把显示值重新按 formatter 收敛一次
  void nextTick(setNativeInputValue)
  emit('blur', event)
}

const onKeydown = (event: KeyboardEvent) => emit('keydown', event)
const onMouseenter = (event: MouseEvent) => emit('mouseenter', event)
const onMouseleave = (event: MouseEvent) => emit('mouseleave', event)

const onCompositionStart = (event: CompositionEvent) => {
  isComposing.value = true
  emit('compositionstart', event)
}
const onCompositionUpdate = (event: CompositionEvent) => emit('compositionupdate', event)
const onCompositionEnd = (event: CompositionEvent) => {
  isComposing.value = false
  emit('compositionend', event)
  // 组词结束才把最终文本交给 v-model
  onInput(event)
}

/** JeFormItem 靠 change / focusout 事件委托做校验，validate-event 为 false 时截断冒泡 */
const onFieldChange = (event: Event) => {
  if (!props.validateEvent) event.stopPropagation()
}
const onFieldFocusout = (event: FocusEvent) => {
  if (!props.validateEvent) event.stopPropagation()
}

/* ------------------------------------------------------------------ 实例方法 */

const focus = () => element()?.focus()
const blur = () => element()?.blur()
const select = () => element()?.select()

/** 点在外框留白或前后缀上时把焦点交给内部控件（触屏上 44px 热区才有意义） */
const onFieldMousedown = (event: MouseEvent) => {
  const target = event.target as HTMLElement | null
  if (!target || target.closest('input, textarea, button, a')) return
  event.preventDefault()
  focus()
}

const clear = () => {
  emit('update:modelValue', '')
  emit('input', '')
  emit('change', '')
  emit('clear')
  // 清空不是用户敲出来的，change 不会自然触发，这里补一个原生事件让表单校验跟上
  if (props.validateEvent) {
    element()?.dispatchEvent(new Event('change', { bubbles: true }))
  }
  focus()
}

const onClearClick = (event: MouseEvent) => {
  event.stopPropagation()
  clear()
}

const togglePassword = (event: MouseEvent) => {
  event.stopPropagation()
  passwordVisible.value = !passwordVisible.value
  void nextTick(() => {
    setNativeInputValue()
    focus()
  })
}

/* -------------------------------------------------------------------- 生命周期 */

watch(displayValue, () => {
  void nextTick(setNativeInputValue)
})

watch(nativeValue, () => {
  void nextTick(resizeTextarea)
})

watch(
  () => props.autosize,
  () => {
    void nextTick(resizeTextarea)
  },
  { deep: true },
)

watch(
  () => props.rows,
  () => {
    void nextTick(resizeTextarea)
  },
)

watch(
  () => props.type,
  () => {
    void nextTick(() => {
      setNativeInputValue()
      resizeTextarea()
    })
  },
)

onMounted(() => {
  setNativeInputValue()
  resizeTextarea()
  if (props.autofocus) focus()
})

const fieldClasses = computed(() => [
  size.value === 'default' ? '' : `je-input--${size.value}`,
  {
    'is-focus': isFocused.value,
    'is-disabled': props.disabled,
    'is-readonly': props.readonly,
    'is-textarea': isTextarea.value,
    'has-prefix': showPrefix.value,
    'has-suffix': hasSuffixArea.value,
    'is-limit': isOverLimit.value,
  },
])

defineExpose({
  input: inputRef,
  textarea: textareaRef,
  ref: computed(() => element()),
  textareaStyle,
  isComposing,
  passwordVisible,
  focus,
  blur,
  select,
  clear,
  resizeTextarea,
})
</script>

<template>
  <div class="je-input-group" :class="groupClasses">
    <div v-if="$slots.prepend" class="je-input-group__prepend">
      <slot name="prepend" />
    </div>

    <div
      class="je-input"
      :class="[fieldClasses, userClass]"
      :style="userStyle"
      @change="onFieldChange"
      @focusout="onFieldFocusout"
      @mousedown="onFieldMousedown"
      @mouseenter="onMouseenter"
      @mouseleave="onMouseleave"
    >
      <span v-if="showPrefix" class="je-input__prefix">
        <slot name="prefix">
          <JeIcon v-if="prefixIconName" :name="prefixIconName" :size="16" />
          <component :is="prefixIconComponent" v-else-if="prefixIconComponent" />
        </slot>
      </span>

      <textarea
        v-if="isTextarea"
        ref="textareaRef"
        v-bind="innerAttrs"
        class="je-input__inner je-input__inner--textarea"
        :value="displayValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="nativeMaxlength"
        :minlength="nativeMinlength"
        :name="name"
        :autocomplete="autocomplete"
        :tabindex="tabindex"
        :form="form"
        :aria-label="ariaLabel"
        :style="[inputStyle, textareaStyle, resizeStyle]"
        @input="onInput"
        @change="onChange"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
        @compositionstart="onCompositionStart"
        @compositionupdate="onCompositionUpdate"
        @compositionend="onCompositionEnd"
      />

      <input
        v-else
        ref="inputRef"
        v-bind="innerAttrs"
        class="je-input__inner"
        :type="effectiveType"
        :value="displayValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="nativeMaxlength"
        :minlength="nativeMinlength"
        :name="name"
        :autocomplete="autocomplete"
        :tabindex="tabindex"
        :form="form"
        :max="max"
        :min="min"
        :step="step"
        :inputmode="inputmode"
        :aria-label="ariaLabel"
        :style="inputStyle"
        @input="onInput"
        @change="onChange"
        @focus="onFocus"
        @blur="onBlur"
        @keydown="onKeydown"
        @compositionstart="onCompositionStart"
        @compositionupdate="onCompositionUpdate"
        @compositionend="onCompositionEnd"
      >

      <span v-if="hasSuffixArea" class="je-input__suffix">
        <slot name="suffix">
          <JeIcon v-if="suffixIconName" :name="suffixIconName" :size="16" />
          <component :is="suffixIconComponent" v-else-if="suffixIconComponent" />
        </slot>

        <button
          v-if="showPwdVisible"
          type="button"
          class="je-input__password"
          :aria-label="passwordVisible ? '隐藏密码' : '显示密码'"
          :aria-pressed="passwordVisible"
          tabindex="-1"
          @mousedown.prevent
          @click="togglePassword"
        >
          <slot name="password-icon" :visible="passwordVisible">
            <JeIcon :name="passwordVisible ? 'eye-off' : 'eye'" :size="16" />
          </slot>
        </button>

        <button
          v-if="showClear"
          type="button"
          class="je-input__clear"
          aria-label="清空输入"
          tabindex="-1"
          @mousedown.prevent
          @click="onClearClick"
        >
          <JeIcon v-if="clearIconName" :name="clearIconName" :size="16" />
          <component :is="clearIconComponent" v-else-if="clearIconComponent" />
        </button>

        <span v-if="showCountInside" class="je-input__count">{{ wordLimitText }}</span>
      </span>
    </div>

    <div v-if="$slots.append" class="je-input-group__append">
      <slot name="append" />
    </div>

    <span
      v-if="isWordLimitVisible && wordLimitPosition === 'outside'"
      class="je-input__count je-input__count--outside"
    >
      {{ wordLimitText }}
    </span>
  </div>
</template>

<style scoped>
/* 没有前置 / 后置插槽时不生成盒子，.je-input 就是实际参与布局的那个元素 */
.je-input-group {
  display: contents;
}

.je-input-group.is-grouped {
  display: flex;
  align-items: stretch;
  width: 100%;
  gap: 0;
}

.je-input {
  /* 尺寸只改这三个变量，default 不产生类名（避免与语义类撞名） */
  --ji-py: 14px;
  --ji-px: 16px;
  --ji-fs: 15px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: var(--ji-py) var(--ji-px);
  font-family: inherit;
  font-size: var(--ji-fs);
  color: var(--je-text);
  background: var(--je-surface);
  border: 1.5px solid var(--je-border-color);
  border-radius: var(--je-radius);
  transition: border-color var(--je-duration) ease, background var(--je-duration) ease,
    box-shadow var(--je-duration) ease;
}

/* 聚焦态的颜色全部由主色现算，换肤时自动跟随 */
.je-input.is-focus {
  border-color: var(--je-primary);
  background: color-mix(in srgb, var(--je-primary) 12%, transparent);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-input.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-input.is-readonly {
  cursor: default;
}

.je-input--large {
  --ji-py: 17px;
  --ji-px: 20px;
  --ji-fs: 17px;
}

.je-input--small {
  --ji-py: 9px;
  --ji-px: 12px;
  --ji-fs: 14px;
}

/* ---------------------------------------------------------------- 内部控件 */

.je-input__inner {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  padding: 0;
  font: inherit;
  line-height: 1.4;
  color: inherit;
  background: none;
  border: none;
  outline: none;
}

.je-input__inner::placeholder {
  color: var(--je-text-faint);
}

.je-input__inner:disabled {
  cursor: not-allowed;
}

.je-input__inner--textarea {
  display: block;
  line-height: 1.6;
}

/* 浏览器自动填充的黄底会破坏主题，用超长过渡把它压掉 */
.je-input__inner:-webkit-autofill {
  -webkit-text-fill-color: var(--je-text);
  transition: background-color 9999s ease-out;
}

/* -------------------------------------------------------------------- 图标 */

.je-input__prefix,
.je-input__suffix {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
  color: var(--je-text-faint);
}

.je-input__clear,
.je-input__password {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  padding: 0;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

.je-input__clear:hover,
.je-input__password:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-input__clear:focus-visible,
.je-input__password:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* ---------------------------------------------------------------- 字数统计 */

.je-input__count {
  flex-shrink: 0;
  font-size: 12px;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  color: var(--je-text-faint);
}

.je-input__count--outside {
  display: block;
  width: 100%;
  margin-top: 6px;
  text-align: right;
}

.je-input.is-limit .je-input__count {
  color: color-mix(in srgb, var(--je-danger) 80%, white);
}

/* ------------------------------------------------------- 复合型（前置/后置） */

.je-input-group__prepend,
.je-input-group__append {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  font-size: 14px;
  color: var(--je-text-muted);
  background: var(--je-surface-hover);
  border: 1.5px solid var(--je-border-color);
}

.je-input-group__prepend {
  border-right: none;
  border-radius: var(--je-radius) 0 0 var(--je-radius);
}

.je-input-group__append {
  border-left: none;
  border-radius: 0 var(--je-radius) var(--je-radius) 0;
}

.je-input-group.is-grouped.has-prepend .je-input {
  border-top-left-radius: 0;
  border-bottom-left-radius: 0;
}

.je-input-group.is-grouped.has-append .je-input {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

/* ---------------------------------------------------------------- 移动端 */

@media (max-width: 768px) {
  .je-input {
    /* 触控热区不小于 44px，字号 16px 避免 iOS 聚焦时自动放大 */
    --ji-py: 12px;
    --ji-px: 14px;
    --ji-fs: 16px;
    min-height: 44px;
  }

  .je-input__clear,
  .je-input__password {
    width: 32px;
    height: 32px;
  }

  .je-input-group__prepend,
  .je-input-group__append {
    padding: 0 12px;
  }
}
</style>
