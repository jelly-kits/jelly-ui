<script setup lang="ts">
import { computed, useId } from 'vue'
import { useJeConfigSize } from '../JeConfigProvider/types'
import type { JeRadioGroupSize, JeRadioOption } from './types'

defineOptions({ name: 'JeRadioGroup' })

const props = withDefaults(
  defineProps<{
    modelValue?: string | number | null
    options: JeRadioOption[]
    /** 原生 radio 的 name，不传则自动生成 */
    name?: string
    disabled?: boolean
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: JeRadioGroupSize
    /** 选项是否带底色，false 时只剩圆圈和文字 */
    background?: boolean
    /** 选项是否带边框（含聚焦时的描边），false 时焦点提示落到圆圈上 */
    border?: boolean
  }>(),
  { modelValue: null, disabled: false, size: undefined, background: true, border: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: string | number] }>()

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-radio-group--${size.value}`))

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
  <div
    class="je-radio-group"
    :class="[
      sizeClass,
      { 'is-disabled': disabled, 'is-no-background': !background, 'is-no-border': !border },
    ]"
    role="radiogroup"
  >
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
  /* 尺寸变量：default 为基础值，修饰类只覆盖这几个变量 */
  --je-rg-h: var(--je-control-h);
  --je-rg-row-px: 12px;
  --je-rg-gap: 12px;
  --je-rg-circle: 18px;
  --je-rg-dot: 8px;
  --je-rg-fs: var(--je-control-fs);
  /* 宽屏一行排多个，放不下自动换行，不浪费右侧空白 */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.je-radio-group--small {
  --je-rg-h: var(--je-control-h-sm);
  --je-rg-row-px: 10px;
  --je-rg-gap: 10px;
  --je-rg-circle: 16px;
  --je-rg-dot: 7px;
  --je-rg-fs: var(--je-control-fs-sm);
}

.je-radio-group--large {
  --je-rg-h: var(--je-control-h-lg);
  --je-rg-row-px: 14px;
  --je-rg-gap: 14px;
  --je-rg-circle: 20px;
  --je-rg-dot: 9px;
  --je-rg-fs: var(--je-control-fs-lg);
}

.je-radio {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--je-rg-gap, 12px);
  box-sizing: border-box;
  min-height: var(--je-rg-h, 32px);
  padding: 0 var(--je-rg-row-px, 14px);
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
  width: var(--je-rg-circle, 22px);
  height: var(--je-rg-circle, 22px);
  border: 2px solid var(--je-border-color);
  border-radius: 50%;
  transition: border-color 0.25s ease, background 0.25s ease;
  will-change: transform;
}

.je-radio__circle::after {
  content: '';
  width: var(--je-rg-dot, 10px);
  height: var(--je-rg-dot, 10px);
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
  font-size: var(--je-rg-fs, 14px);
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

/* 去掉底色：选项不再是一块圆角底色，hover 也不加，只留圆圈和文字 */
.je-radio-group.is-no-background .je-radio,
.je-radio-group.is-no-background .je-radio:hover {
  background: transparent;
}

/*
 * 去掉边框：外框本就只在聚焦时显色，这里把它彻底让出去；
 * 键盘聚焦的提示落到圆圈上（用 focus-visible，鼠标点选不会留下痕迹）。
 */
.je-radio-group.is-no-border .je-radio:focus-within {
  border-color: transparent;
}

.je-radio-group.is-no-border .je-radio__input:focus-visible + .je-radio__circle {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 选中时 1 → 1.35 → 1，两段都走减速曲线，合起来就是弹簧的「弹一下再落稳」 */
.je-radio__circle.is-popping {
  animation: je-radio-pop 0.6s;
}

/* 窄屏：行高接同一套触屏档（40 / 44 / 48），与 input / select / button 同行时不会高低不齐 */
@media (max-width: 768px) {
  .je-radio-group {
    /* 窄屏同样一行多个：文字不多时并排，放不下自动换行 */
    --je-rg-h: var(--je-touch-h);
    --je-rg-row-px: var(--je-touch-px);
    --je-rg-circle: 20px;
    --je-rg-dot: 9px;
    --je-rg-fs: var(--je-touch-fs);
  }

  .je-radio-group--small {
    --je-rg-h: var(--je-touch-h-sm);
    --je-rg-row-px: var(--je-touch-px-sm);
    --je-rg-circle: 18px;
    --je-rg-dot: 8px;
    --je-rg-fs: var(--je-touch-fs-sm);
  }

  .je-radio-group--large {
    --je-rg-h: var(--je-touch-h-lg);
    --je-rg-row-px: var(--je-touch-px-lg);
    --je-rg-circle: 22px;
    --je-rg-dot: 10px;
    --je-rg-fs: var(--je-touch-fs-lg);
  }
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