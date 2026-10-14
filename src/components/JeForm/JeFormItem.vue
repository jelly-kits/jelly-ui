<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  getValueByPath,
  jeFormContextKey,
  matchTrigger,
  runRule,
  setValueByPath,
  type JeFormRule,
  type JeFormTrigger,
} from '../../core/form'
import { useJeConfigSize } from '../JeConfigProvider/types'

defineOptions({ name: 'JeFormItem' })

const props = withDefaults(
  defineProps<{
    /** 字段路径，需与表单 model 对应 */
    prop?: string
    label?: string
    /** 覆盖表单级的标签宽度 */
    labelWidth?: string | number
    /** 强制显示必填星号 */
    required?: boolean
    /** 覆盖表单级规则 */
    rules?: JeFormRule[]
    /** 手动指定的错误信息，优先级最高 */
    error?: string
    /** 是否显示校验错误文案 */
    showMessage?: boolean
    /** 关联控件的 id，便于点击标签聚焦 */
    htmlFor?: string
  }>(),
  { prop: '', required: false, showMessage: true },
)

const form = inject(jeFormContextKey, undefined)

const state = ref<'' | 'error' | 'success'>('')
const message = ref('')

const collectRules = (): JeFormRule[] => {
  if (props.rules) return props.rules
  if (form && props.prop) return form.rules[props.prop] ?? []
  return []
}

const isRequired = computed(() => props.required || collectRules().some((rule) => rule.required))

const labelPosition = computed(() => form?.labelPosition.value ?? 'top')
const width = computed(() => {
  const raw = props.labelWidth ?? form?.labelWidth.value ?? ''
  return typeof raw === 'number' ? `${raw}px` : raw
})

/** 尺寸档位：本组件没有 size prop，只跟随 JeForm / JeConfigProvider 下发的档位 */
const size = useJeConfigSize(() => undefined)
/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-form-item--${size.value}`))

/** 返回错误文案，null 表示通过 */
const validate = async (trigger?: JeFormTrigger): Promise<string | null> => {
  if (props.error) {
    state.value = 'error'
    message.value = props.error
    return props.error
  }

  const rules = collectRules().filter((rule) => matchTrigger(rule, trigger))
  if (rules.length === 0) return null

  const value = form && props.prop ? getValueByPath(form.model, props.prop) : undefined
  for (const rule of rules) {
    const result = await runRule(rule, value, form?.model ?? {})
    if (result) {
      state.value = 'error'
      message.value = result
      return result
    }
  }

  state.value = 'success'
  message.value = ''
  return null
}

const clearValidate = () => {
  state.value = ''
  message.value = ''
}

const reset = () => {
  if (form && props.prop) {
    setValueByPath(form.model, props.prop, getValueByPath(form.initialModel, props.prop))
  }
  clearValidate()
}

const field = { prop: props.prop, validate, clearValidate, reset }
onMounted(() => form?.addField(field))
onBeforeUnmount(() => form?.removeField(field))

// 用事件委托接管原生控件的触发时机：focusout / change 都会冒泡到这里
const onFocusout = () => {
  void validate('blur')
}
const onChange = () => {
  void validate('change')
}
</script>

<template>
  <div
    class="je-form-item"
    :class="[
      `is-label-${labelPosition}`,
      sizeClass,
      {
        'is-required': isRequired,
        'is-error': state === 'error',
        'is-success': state === 'success',
      },
    ]"
    @focusout="onFocusout"
    @change="onChange"
  >
    <label
      v-if="label"
      class="je-form-item__label"
      :for="htmlFor"
      :style="width ? { width } : undefined"
    >
      {{ label }}
    </label>

    <div class="je-form-item__content">
      <slot />
      <p v-if="showMessage && state === 'error' && message" class="je-form-item__error" role="alert">
        {{ message }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.je-form-item {
  /* default 档直接引用全局控件 token，small / large 只覆盖这几个变量 */
  --je-form-label-fs: var(--je-control-fs);
  --je-form-label-gap: 10px;
  --je-form-label-pt: 8px;
  --je-form-item-mb: 22px;
  margin-bottom: var(--je-form-item-mb);
}

.je-form-item--small {
  --je-form-label-fs: var(--je-control-fs-sm);
  --je-form-label-gap: 8px;
  --je-form-label-pt: 6px;
  --je-form-item-mb: 18px;
}

.je-form-item--large {
  --je-form-label-fs: var(--je-control-fs-lg);
  --je-form-label-gap: 12px;
  --je-form-label-pt: 10px;
  --je-form-item-mb: 26px;
}

.je-form-item__label {
  font-size: var(--je-form-label-fs);
  font-weight: 500;
  color: var(--je-text-muted);
  transition: color var(--je-duration) ease, transform 0.4s var(--je-ease-overshoot);
}

/* 标签堆叠在控件上方 */
.je-form-item.is-label-top > .je-form-item__label {
  display: block;
  margin-bottom: var(--je-form-label-gap);
}

/* 左右标签：标签与内容并排 */
.je-form-item.is-label-left,
.je-form-item.is-label-right {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.je-form-item.is-label-left > .je-form-item__label,
.je-form-item.is-label-right > .je-form-item__label {
  flex: 0 0 auto;
  padding-top: var(--je-form-label-pt);
  line-height: 1.2;
}

.je-form-item.is-label-right > .je-form-item__label {
  text-align: right;
}

.je-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

/* 内部控件获得焦点时把标签点亮并右移，和 JeField 的手感一致 */
.je-form-item:focus-within > .je-form-item__label {
  color: color-mix(in srgb, var(--je-primary) 65%, white);
}

.je-form-item.is-label-top:focus-within > .je-form-item__label {
  transform: translateX(4px);
}

.je-form-item.is-error > .je-form-item__label {
  color: color-mix(in srgb, var(--je-danger) 75%, white);
}

.je-form-item.is-required > .je-form-item__label::before {
  content: '*';
  margin-right: 4px;
  color: var(--je-danger);
}

.je-form-item__error {
  margin: 6px 0 0;
  font-size: 12px;
  line-height: 1.4;
  color: color-mix(in srgb, var(--je-danger) 75%, white);
  animation: je-form-error-in 0.24s var(--je-ease-out-back) both;
}

@keyframes je-form-error-in {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-form-item__error {
    animation: none;
  }
}
</style>