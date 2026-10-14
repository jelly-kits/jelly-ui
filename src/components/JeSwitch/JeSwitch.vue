<script setup lang="ts">
import { computed } from 'vue'
import { JeIcon } from '../JeIcon'
import { useJeConfigSize } from '../JeConfigProvider/types'
import type { JeSwitchSize, JeSwitchValue } from './types'

defineOptions({ name: 'JeSwitch' })

const props = withDefaults(
  defineProps<{
    modelValue?: JeSwitchValue
    activeValue?: JeSwitchValue
    inactiveValue?: JeSwitchValue
    /** 打开态文案，显示在右侧 */
    activeText?: string
    /** 关闭态文案，显示在左侧 */
    inactiveText?: string
    disabled?: boolean
    loading?: boolean
    /** 尺寸，不传时取全局配置（configureJelly / JeConfigProvider） */
    size?: JeSwitchSize
  }>(),
  {
    modelValue: false,
    activeValue: true,
    inactiveValue: false,
    disabled: false,
    loading: false,
    size: undefined,
  },
)

const emit = defineEmits<{ 'update:modelValue': [value: JeSwitchValue] }>()

const checked = computed(() => props.modelValue === props.activeValue)

/** 尺寸：组件自身优先，再退回全局配置（configureJelly / JeConfigProvider） */
const size = useJeConfigSize(() => props.size)

/** default 不产生类名（基础样式即 default） */
const sizeClass = computed(() => (size.value === 'default' ? '' : `je-switch--${size.value}`))

/** loading 图标随尺寸缩放 */
const ICON_SIZE: Record<JeSwitchSize, number> = { small: 10, default: 12, large: 14 }
const iconSize = computed(() => ICON_SIZE[size.value])

const toggle = () => {
  if (props.disabled || props.loading) return
  emit('update:modelValue', checked.value ? props.inactiveValue : props.activeValue)
}
</script>

<template>
  <button
    type="button"
    class="je-switch"
    :class="[sizeClass, { 'is-checked': checked, 'is-loading': loading }]"
    role="switch"
    :aria-checked="checked"
    :disabled="disabled || loading"
    @click="toggle"
  >
    <span v-if="inactiveText" class="je-switch__text je-switch__text--inactive">
      {{ inactiveText }}
    </span>

    <span class="je-switch__track">
      <span class="je-switch__thumb">
        <JeIcon v-if="loading" name="loading" :size="iconSize" spin />
      </span>
    </span>

    <span v-if="activeText" class="je-switch__text je-switch__text--active">
      {{ activeText }}
    </span>
  </button>
</template>

<style scoped>
.je-switch {
  /* 尺寸变量：default 为基础值，修饰类只覆盖这几个变量 */
  --je-sw-track-w: 44px;
  --je-sw-track-h: 24px;
  --je-sw-thumb: 19px;
  --je-sw-inset: 2px;
  --je-sw-shift: 21px;
  --je-sw-text-fs: 13px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 0;
  font-family: inherit;
  background: none;
  border: none;
  cursor: pointer;
  outline: none;
}

.je-switch--small {
  --je-sw-track-w: 36px;
  --je-sw-track-h: 20px;
  --je-sw-thumb: 15px;
  --je-sw-inset: 2px;
  --je-sw-shift: 17px;
  --je-sw-text-fs: 12px;
}

.je-switch--large {
  --je-sw-track-w: 52px;
  --je-sw-track-h: 28px;
  --je-sw-thumb: 23px;
  --je-sw-inset: 2px;
  --je-sw-shift: 25px;
  --je-sw-text-fs: 14px;
}

.je-switch__track {
  position: relative;
  display: inline-block;
  box-sizing: border-box;
  width: var(--je-sw-track-w, 44px);
  height: var(--je-sw-track-h, 24px);
  background: var(--je-surface);
  border: 1.5px solid var(--je-border-color);
  border-radius: 999px;
  transition: background 0.3s ease, border-color 0.3s ease,
    box-shadow 0.3s ease;
}

/* 打开态：渐变与光晕都由主色现算，换肤后自动跟随 */
.je-switch.is-checked .je-switch__track {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
  box-shadow: 0 6px 18px color-mix(in srgb, var(--je-primary) 40%, transparent);
}

.je-switch__thumb {
  position: absolute;
  top: var(--je-sw-inset, 2px);
  left: var(--je-sw-inset, 2px);
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--je-sw-thumb, 19px);
  height: var(--je-sw-thumb, 19px);
  color: var(--je-primary);
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.25);
  /* 带轻微过冲的位移，落到两端时有一点果冻回弹 */
  transition: transform 0.36s var(--je-ease-out-back);
}

.je-switch.is-checked .je-switch__thumb {
  transform: translateX(var(--je-sw-shift, 21px));
}

.je-switch__text {
  font-size: var(--je-sw-text-fs, 13px);
  color: var(--je-text-faint);
  transition: color 0.25s ease;
}

.je-switch.is-checked .je-switch__text--active,
.je-switch:not(.is-checked) .je-switch__text--inactive {
  color: var(--je-text);
  font-weight: 500;
}

.je-switch:focus-visible .je-switch__track {
  outline: 2px solid var(--je-primary);
  outline-offset: 3px;
}

.je-switch:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* 窄屏保证 44px 触控热区，轨道本身尺寸不变 */
@media (max-width: 768px) {
  .je-switch {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-switch__track,
  .je-switch__thumb {
    transition: none;
  }
}
</style>