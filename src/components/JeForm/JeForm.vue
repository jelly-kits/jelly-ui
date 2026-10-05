<script setup lang="ts">
import { computed, provide, toRef } from 'vue'
import {
  jeFormContextKey,
  type JeFieldContext,
  type JeFormContext,
  type JeFormLabelPosition,
  type JeFormRules,
} from '../../core/form'
import { useIsMobile } from '../../core/useMediaQuery'

defineOptions({ name: 'JeForm' })

const props = withDefaults(
  defineProps<{
    /** 表单数据对象，字段通过 prop 路径读写 */
    model: Record<string, unknown>
    /** 校验规则，键为字段路径 */
    rules?: JeFormRules
    /** 标签位置；窄屏一律堆叠到控件上方 */
    labelPosition?: JeFormLabelPosition
    /** 左 / 右标签的固定宽度，数字按 px 处理 */
    labelWidth?: string | number
    disabled?: boolean
  }>(),
  { rules: () => ({}), labelPosition: 'top', labelWidth: '', disabled: false },
)

const emit = defineEmits<{ validate: [prop: string, valid: boolean, message: string] }>()

const isMobile = useIsMobile()

/** 深拷贝一个纯数据快照，供 resetFields 回滚 */
const clone = <T,>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => clone(item)) as unknown as T
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, clone(item)]),
    ) as T
  }
  return value
}

const initialModel = clone(props.model)
const fields: JeFieldContext[] = []

const labelPosition = computed<JeFormLabelPosition>(() =>
  isMobile.value ? 'top' : props.labelPosition,
)
const labelWidth = computed(() =>
  typeof props.labelWidth === 'number' ? `${props.labelWidth}px` : props.labelWidth,
)
const disabled = toRef(props, 'disabled')

const context: JeFormContext = {
  get model() {
    return props.model
  },
  initialModel,
  get rules() {
    return props.rules
  },
  labelPosition,
  labelWidth,
  disabled,
  addField(field) {
    if (!fields.includes(field)) fields.push(field)
  },
  removeField(field) {
    const index = fields.indexOf(field)
    if (index >= 0) fields.splice(index, 1)
  },
}

provide(jeFormContextKey, context)

const pick = (target?: string | string[]) => {
  if (!target) return [...fields]
  const wanted = Array.isArray(target) ? target : [target]
  return fields.filter((field) => wanted.includes(field.prop))
}

/** 校验全部字段，返回是否全部通过 */
const validate = async (): Promise<boolean> => {
  const results = await Promise.all(fields.map(async (field) => [field.prop, await field.validate()] as const))
  let valid = true
  for (const [prop, message] of results) {
    if (message) {
      valid = false
      emit('validate', prop, false, message)
    }
  }
  return valid
}

/** 校验指定字段（不传则全部） */
const validateField = async (target?: string | string[]): Promise<boolean> => {
  const list = pick(target)
  const results = await Promise.all(list.map(async (field) => [field.prop, await field.validate()] as const))
  let valid = true
  for (const [prop, message] of results) {
    if (message) {
      valid = false
      emit('validate', prop, false, message)
    }
  }
  return valid
}

/** 把字段值恢复成初始值并清空校验态 */
const resetFields = (target?: string | string[]) => {
  pick(target).forEach((field) => field.reset())
}

/** 只清空校验态，不动数据 */
const clearValidate = (target?: string | string[]) => {
  pick(target).forEach((field) => field.clearValidate())
}

defineExpose({ validate, validateField, resetFields, clearValidate })
</script>

<template>
  <form class="je-form" :class="{ 'is-disabled': disabled }" @submit.prevent>
    <slot />
  </form>
</template>

<style scoped>
.je-form {
  font-family: inherit;
}
</style>