<script setup lang="ts">
import { inject } from 'vue'
import { JeIcon, type JeIconName } from '../JeIcon'
import { jeDropdownKey } from './types'

defineOptions({ name: 'JeDropdownItem' })

const props = withDefaults(
  defineProps<{
    /** 选中时通过父级 command 事件抛出的值 */
    command?: string | number
    disabled?: boolean
    /** 与上一项之间画一条分隔线 */
    divided?: boolean
    icon?: JeIconName
  }>(),
  { disabled: false, divided: false },
)

const ctx = inject(jeDropdownKey, null)

/** command 省略时回退成该项在菜单中的序号，保证事件里始终有值 */
const menuIndexOf = (el: HTMLElement) => {
  const menu = el.closest('[role="menu"]')
  if (!menu) return -1
  return Array.from(menu.querySelectorAll('[role="menuitem"]')).indexOf(el)
}

const onSelect = (event: MouseEvent) => {
  if (props.disabled || !ctx) return
  const el = event.currentTarget as HTMLElement
  ctx.handleSelect(props.command ?? menuIndexOf(el))
}
</script>

<template>
  <div
    class="je-dropdown__item"
    :class="{ 'is-disabled': disabled, 'is-divided': divided }"
    role="menuitem"
    tabindex="-1"
    :aria-disabled="disabled ? 'true' : undefined"
    @click="onSelect"
  >
    <JeIcon v-if="icon" class="je-dropdown__item-icon" :name="icon" :size="16" />
    <span class="je-dropdown__item-label"><slot /></span>
  </div>
</template>

<style scoped>
.je-dropdown__item {
  display: flex;
  align-items: center;
  gap: 10px;
  box-sizing: border-box;
  min-height: 38px;
  padding: 9px 12px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  user-select: none;
  transition: background 0.2s ease, color 0.2s ease;
}

/* 键盘高亮与鼠标悬停共用一套样式 */
.je-dropdown__item:hover,
.je-dropdown__item:focus,
.je-dropdown__item:focus-visible {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 20%, transparent);
}

.je-dropdown__item.is-disabled {
  cursor: not-allowed;
  color: var(--je-text-faint);
  opacity: 0.6;
}

.je-dropdown__item.is-disabled:hover,
.je-dropdown__item.is-disabled:focus {
  color: var(--je-text-faint);
  background: transparent;
}

.je-dropdown__item.is-divided {
  margin-top: 6px;
  padding-top: 12px;
  border-top: var(--je-border);
  border-radius: 0 0 var(--je-radius-sm) var(--je-radius-sm);
}

.je-dropdown__item-icon {
  color: currentColor;
}

.je-dropdown__item-label {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 触屏热区不小于 44px */
@media (max-width: 768px) {
  .je-dropdown__item {
    min-height: 48px;
    padding: 12px 14px;
    font-size: 15px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-dropdown__item {
    transition: none;
  }
}
</style>
