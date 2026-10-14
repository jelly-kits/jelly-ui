<script setup lang="ts">
import { computed } from 'vue'
import { useJeConfigSize } from '../JeConfigProvider/types'
import type { JeCheckboxGroupSize, JeCheckboxOption } from './types'

defineOptions({ name: 'JeCheckboxGroup' })

const props = withDefaults(
  defineProps<{
    modelValue?: (string | number)[]
    options: JeCheckboxOption[]
    disabled?: boolean
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: JeCheckboxGroupSize
    /** 选项是否带底色，false 时只剩勾选框和文字 */
    background?: boolean
    /** 选项是否带边框（含聚焦时的描边），false 时焦点提示落到勾选框上 */
    border?: boolean
  }>(),
  { modelValue: () => [], disabled: false, size: undefined, background: true, border: true },
)

const emit = defineEmits<{ 'update:modelValue': [value: (string | number)[]] }>()

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() =>
  size.value === 'default' ? '' : `je-checkbox-group--${size.value}`,
)

const isChecked = (value: string | number) => props.modelValue.includes(value)

/**
 * 重播一次性 pop 动画。
 * 同一个元素连点也要能重播，所以先把类摘掉、读一次布局属性强制重排，再加回去。
 * 整个流程是同步的，不依赖 rAF / setTimeout。
 */
const replayPop = (el: HTMLElement | null, className: string) => {
  if (!el) return
  el.classList.remove('is-pop-in', 'is-pop-out')
  void el.offsetWidth
  el.classList.add(className)
}

const toggle = (option: JeCheckboxOption, event: Event) => {
  if (props.disabled) return

  const next = [...props.modelValue]
  const at = next.indexOf(option.value)
  const checked = at < 0
  if (checked) next.push(option.value)
  else next.splice(at, 1)
  emit('update:modelValue', next)

  const box = (event.currentTarget as HTMLElement).nextElementSibling
  replayPop(box as HTMLElement | null, checked ? 'is-pop-in' : 'is-pop-out')
}
</script>

<template>
  <div
    class="je-checkbox-group"
    :class="[
      sizeClass,
      { 'is-disabled': disabled, 'is-no-background': !background, 'is-no-border': !border },
    ]"
  >
    <label v-for="option in options" :key="option.value" class="je-checkbox">
      <input
        class="je-checkbox__input"
        type="checkbox"
        :value="option.value"
        :checked="isChecked(option.value)"
        :disabled="disabled"
        @change="toggle(option, $event)"
      >
      <span class="je-checkbox__box">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <polyline points="4,12 10,18 20,6" />
        </svg>
      </span>
      <span class="je-checkbox__label">{{ option.label }}</span>
    </label>
  </div>
</template>

<style scoped>
.je-checkbox-group {
  /* 尺寸变量：default 为基础值，修饰类只覆盖这几个变量 */
  --je-cg-h: var(--je-control-h);
  --je-cg-row-px: 12px;
  --je-cg-gap: 12px;
  --je-cg-box: 18px;
  --je-cg-check: 12px;
  --je-cg-fs: var(--je-control-fs);
  /* 宽屏一行排多个，放不下自动换行，不浪费右侧空白 */
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.je-checkbox-group--small {
  --je-cg-h: var(--je-control-h-sm);
  --je-cg-row-px: 10px;
  --je-cg-gap: 10px;
  --je-cg-box: 16px;
  --je-cg-check: 11px;
  --je-cg-fs: var(--je-control-fs-sm);
}

.je-checkbox-group--large {
  --je-cg-h: var(--je-control-h-lg);
  --je-cg-row-px: 14px;
  --je-cg-gap: 14px;
  --je-cg-box: 20px;
  --je-cg-check: 14px;
  --je-cg-fs: var(--je-control-fs-lg);
}

.je-checkbox {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--je-cg-gap, 12px);
  box-sizing: border-box;
  min-height: var(--je-cg-h, 32px);
  padding: 0 var(--je-cg-row-px, 14px);
  background: var(--je-surface);
  border: 1.5px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  user-select: none;
  transition: background 0.25s ease, border-color 0.25s ease;
}

.je-checkbox:hover {
  background: var(--je-surface-hover);
}

.je-checkbox:focus-within {
  border-color: var(--je-primary);
}

.je-checkbox__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.je-checkbox__box {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--je-cg-box, 22px);
  height: var(--je-cg-box, 22px);
  border: 2px solid var(--je-border-color);
  border-radius: 7px;
  transition: border-color 0.25s ease, background 0.25s ease;
  will-change: transform;
}

.je-checkbox__box svg {
  width: var(--je-cg-check, 13px);
  height: var(--je-cg-check, 13px);
  fill: none;
  /* 勾只在选中（渐变底）时出现，固定浅色 */
  stroke: var(--je-text-on-color);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 24;
  stroke-dashoffset: 24;
  /*
   * 未选中时那条线是「零长度 dash」，而圆头线帽会把零长度 dash 画成一个圆点
   * —— 就是框里那个白点。所以除了把描边收回去，还得整条藏起来。
   */
  opacity: 0;
  transition: stroke-dashoffset 0.3s ease 0.1s, opacity 0.3s ease 0.1s;
}

.je-checkbox__input:checked + .je-checkbox__box {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

.je-checkbox__input:checked + .je-checkbox__box svg {
  stroke-dashoffset: 0;
  opacity: 1;
}

.je-checkbox__label {
  font-size: var(--je-cg-fs, 14px);
  color: var(--je-text-muted);
  transition: color 0.25s ease;
}

.je-checkbox__input:checked ~ .je-checkbox__label {
  font-weight: 500;
  color: var(--je-text);
}

.je-checkbox-group.is-disabled .je-checkbox {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 去掉底色：选项不再是一块圆角底色，hover 也不加，只留勾选框和文字 */
.je-checkbox-group.is-no-background .je-checkbox,
.je-checkbox-group.is-no-background .je-checkbox:hover {
  background: transparent;
}

/*
 * 去掉边框：外框本就只在聚焦时显色，这里把它彻底让出去；
 * 键盘聚焦的提示落到勾选框上（用 focus-visible，鼠标点选不会留下痕迹）。
 */
.je-checkbox-group.is-no-border .je-checkbox:focus-within {
  border-color: transparent;
}

.je-checkbox-group.is-no-border .je-checkbox__input:focus-visible + .je-checkbox__box {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 勾选 1 → 1.35、取消 1 → 0.85，落稳后都回到 1；中值由各自类里的变量给出 */
.je-checkbox__box.is-pop-in,
.je-checkbox__box.is-pop-out {
  animation: je-box-pop 0.6s;
}

.je-checkbox__box.is-pop-in {
  --je-pop-mid: 1.35;
}

.je-checkbox__box.is-pop-out {
  --je-pop-mid: 0.85;
}

/* 窄屏：行高接同一套触屏档（40 / 44 / 48），与 input / select / button 同行时不会高低不齐 */
@media (max-width: 768px) {
  .je-checkbox-group {
    /* 窄屏同样一行多个：文字不多时并排，放不下自动换行 */
    --je-cg-h: var(--je-touch-h);
    --je-cg-row-px: var(--je-touch-px);
    --je-cg-box: 20px;
    --je-cg-check: 13px;
    --je-cg-fs: var(--je-touch-fs);
  }

  .je-checkbox-group--small {
    --je-cg-h: var(--je-touch-h-sm);
    --je-cg-row-px: var(--je-touch-px-sm);
    --je-cg-box: 18px;
    --je-cg-check: 12px;
    --je-cg-fs: var(--je-touch-fs-sm);
  }

  .je-checkbox-group--large {
    --je-cg-h: var(--je-touch-h-lg);
    --je-cg-row-px: var(--je-touch-px-lg);
    --je-cg-box: 22px;
    --je-cg-check: 14px;
    --je-cg-fs: var(--je-touch-fs-lg);
  }
}

@keyframes je-box-pop {
  0% {
    transform: scale(1);
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  40% {
    transform: scale(var(--je-pop-mid));
    animation-timing-function: cubic-bezier(0.22, 1, 0.36, 1);
  }
  100% {
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-checkbox__box.is-pop-in,
  .je-checkbox__box.is-pop-out {
    animation: none;
  }
}
</style>