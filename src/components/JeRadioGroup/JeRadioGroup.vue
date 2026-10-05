<script setup lang="ts">
import { computed, useId } from 'vue'
import type { JeRadioOption } from './types'

defineOptions({ name: 'JeRadioGroup' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: JeRadioOption[]
    /** 原生 radio 的 name，不传则自动生成 */
    name?: string
    disabled?: boolean
  }>(),
  { modelValue: null, disabled: false },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

const uid = useId()
const groupName = computed(() => props.name ?? `je-radio-${uid}`)

/**
 * 重播一次性 pop 动画。
 * 同一个元素连点也要能重播，所以先把类摘掉、读一次布局属性强制重排，再加回去。
 * 整个流程是同步的，不依赖 rAF / setTimeout。
 */
const replayPop = (el: HTMLElement | null) => {
  if (!el) return
  el.classList.remove('is-popping')
  void el.offsetWidth
  el.classList.add('is-popping')
}

const select = (option: JeRadioOption, event: Event) => {
  if (props.disabled) return
  if (option.value !== props.modelValue) emit('update:modelValue', option.value)
  replayPop((event.currentTarget as HTMLElement).nextElementSibling as HTMLElement | null)
}
</script>

<template>
  <div class="je-radio-group" :class="{ 'is-disabled': disabled }" role="radiogroup">
    <label v-for="option in options" :key="option.value" class="je-radio">
      <input
        class="je-radio__input"
        type="radio"
        :name="groupName"
        :value="option.value"
        :checked="option.value === modelValue"
        :disabled="disabled"
        @change="select(option, $event)"
      >
      <span class="je-radio__circle" />
      <span class="je-radio__label">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.je-radio-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.je-radio {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--je-surface);
  border: 1.5px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.je-radio:hover {
  background: var(--je-surface-hover);
}

.je-radio:focus-within {
  border-color: var(--je-primary);
}

/* 隐藏原生 input，但保留它的语义与键盘方向键行为 */
.je-radio__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.je-radio__circle {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 22px;
  height: 22px;
  border: 2px solid var(--je-border-color);
  border-radius: 50%;
  transition: border-color 0.25s ease, background 0.25s ease;
  will-change: transform;
}

.je-radio__circle::after {
  content: '';
  width: 10px;
  height: 10px;
  /* 只在选中时出现，压在品牌渐变上，固定浅色 */
  background: var(--je-text-on-color);
  border-radius: 50%;
  transform: scale(0);
  transition: transform 0.4s var(--je-ease-overshoot);
}

.je-radio__input:checked + .je-radio__circle {
  border-color: var(--je-primary);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
}

.je-radio__input:checked + .je-radio__circle::after {
  transform: scale(1);
}

.je-radio__label {
  font-size: 14px;
  color: var(--je-text-muted);
  transition: color 0.25s ease;
}

.je-radio__input:checked ~ .je-radio__label {
  font-weight: 500;
  color: var(--je-text);
}

.je-radio-group.is-disabled .je-radio {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 选中时 1 → 1.35 → 1，两段都走减速曲线，合起来就是弹簧的「弹一下再落稳」 */
.je-radio__circle.is-popping {
  animation: je-radio-pop 0.6s;
}

@keyframes je-radio-pop {
  0% {
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  40% {
    transform: scale(1.35);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-radio__circle.is-popping {
    animation: none;
  }
}
</style>