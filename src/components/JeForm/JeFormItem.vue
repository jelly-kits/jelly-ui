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
  margin-bottom: 22px;
}

.je-form-item__label {
  font-size: 13px;
  font-weight: 500;
  color: var(--je-text-muted);
  transition: color var(--je-duration) ease, transform 0.4s var(--je-ease-overshoot);
}

/* 标签堆叠在控件上方（窄屏统一走这一形态） */
.je-form-item.is-label-top > .je-form-item__label {
  display: block;
  margin-bottom: 10px;
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
  padding-top: 15px;
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