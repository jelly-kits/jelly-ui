<script setup lang="ts">
import { computed, ref } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'

defineOptions({ name: 'JeSearch' })

const props = withDefaults(
  defineProps<{
    /** 搜索关键字 */
    modelValue?: string
    /** 输入框占位提示 */
    placeholder?: string
    /** 外形：胶囊 / 圆角方形 */
    shape?: 'round' | 'square'
    /** 输入框背景，传任意 CSS 颜色；不传则用主题表面色 */
    background?: string
    disabled?: boolean
    readonly?: boolean
    maxlength?: number
    /** 右侧显示「取消」按钮（移动端常见） */
    showCancel?: boolean
    /** 取消按钮文案 */
    cancelText?: string
    /** 有内容时显示清除按钮 */
    clearable?: boolean
  }>(),
  {
    modelValue: '',
    placeholder: '请输入关键字',
    shape: 'round',
    background: '',
    disabled: false,
    readonly: false,
    maxlength: undefined,
    showCancel: false,
    cancelText: '取消',
    clearable: true,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** 键盘回车或点击右侧搜索区时触发 */
  search: [value: string]
  /** 点击取消按钮 */
  cancel: []
  /** 点击清除按钮 */
  clear: []
  focus: [event: FocusEvent]
  blur: [event: FocusEvent]
}>()

const focused = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

const showClear = computed(
  () => props.clearable && !props.disabled && !props.readonly && props.modelValue.length > 0,
)

/** 只在传了自定义背景时才注入变量，否则走 CSS 里的默认值 */
const rootStyle = computed(() =>
  props.background ? { '--je-search-bg': props.background } : undefined,
)

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLInputElement).value)
}

const onSearch = () => {
  if (props.disabled) return
  emit('search', props.modelValue)
}

const onClear = () => {
  emit('update:modelValue', '')
  emit('clear')
  inputRef.value?.focus()
}

const onCancel = () => {
  emit('cancel')
}

const onFocus = (event: FocusEvent) => {
  focused.value = true
  emit('focus', event)
}

const onBlur = (event: FocusEvent) => {
  focused.value = false
  emit('blur', event)
}
</script>

<template>
  <div
    class="je-search"
    :class="[`je-search--${shape}`, { 'is-focused': focused, 'is-disabled': disabled }]"
    :style="rootStyle"
  >
    <div class="je-search__field">
      <JeIcon class="je-search__icon" name="search" :size="16" />

      <input
        ref="inputRef"
        class="je-search__input"
        type="search"
        autocomplete="off"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        @input="onInput"
        @keydown.enter="onSearch"
        @focus="onFocus"
        @blur="onBlur"
      >

      <button
        v-if="showClear"
        type="button"
        class="je-search__clear"
        aria-label="清除"
        @click="onClear"
      >
        <JeIcon name="close" :size="12" />
      </button>
    </div>

    <button
      v-if="showCancel"
      type="button"
      class="je-search__cancel"
      :disabled="disabled"
      @click="onCancel"
    >
      {{ cancelText }}
    </button>
  </div>
</template>

<style scoped>
.je-search {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: inherit;
  /* 输入框底色，可被 background 属性覆盖 */
  --je-search-bg: var(--je-surface);
}

.je-search__field {
  display: flex;
  flex: 1 1 auto;
  align-items: center;
  gap: 8px;
  box-sizing: border-box;
  min-width: 0;
  height: 42px;
  padding: 0 14px;
  color: var(--je-text-faint);
  background: var(--je-search-bg);
  border: 1.5px solid transparent;
  transition: border-color var(--je-duration) ease, box-shadow var(--je-duration) ease;
}

.je-search--round .je-search__field {
  border-radius: 999px;
}

.je-search--square .je-search__field {
  border-radius: var(--je-radius);
}

/* 聚焦态只提亮描边与光晕，保留 background 属性给的底色 */
.je-search.is-focused .je-search__field {
  border-color: var(--je-primary);
  box-shadow: 0 8px 24px color-mix(in srgb, var(--je-primary) 25%, transparent);
}

.je-search__input {
  flex: 1 1 auto;
  min-width: 0;
  padding: 0;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-text);
  background: none;
  border: none;
  outline: none;
}

.je-search__input::placeholder {
  color: var(--je-text-faint);
}

/* 关掉 Safari/Chrome 自带的一键清空水印，统一用自绘清除按钮 */
.je-search__input::-webkit-search-cancel-button {
  display: none;
}

.je-search__clear {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  padding: 0;
  color: var(--je-text);
  cursor: pointer;
  background: var(--je-border-color);
  border: none;
  border-radius: 50%;
  transition: opacity var(--je-duration) ease;
}

.je-search__clear:hover {
  opacity: 0.7;
}

.je-search__cancel {
  flex-shrink: 0;
  height: 42px;
  padding: 0 2px;
  font-family: inherit;
  font-size: 15px;
  color: var(--je-primary);
  cursor: pointer;
  background: none;
  border: none;
}

.je-search__cancel:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-search.is-disabled .je-search__field {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-search.is-disabled .je-search__input {
  cursor: not-allowed;
}

@media (max-width: 768px) {
  /* 触屏上把输入框与取消按钮热区兜到 44px 以上 */
  .je-search__field,
  .je-search__cancel {
    height: 44px;
  }
}
</style>
