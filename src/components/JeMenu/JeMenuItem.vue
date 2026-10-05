<script setup lang="ts">
import { computed, inject } from 'vue'
import { JeIcon, type JeIconName } from '../JeIcon'
import { JeTooltip } from '../JeTooltip'
import { jeMenuKey, jeMenuParentKey, type JeMenuIndex } from './types'

defineOptions({ name: 'JeMenuItem' })

const props = withDefaults(
  defineProps<{
    index: JeMenuIndex
    disabled?: boolean
    icon?: JeIconName
  }>(),
  { disabled: false, icon: undefined },
)

const menu = inject(jeMenuKey)
const parent = inject(jeMenuParentKey, undefined)

const active = computed(() => menu?.activeIndex.value === props.index)
/** 折叠态只留图标；浮层内的项不受折叠影响 */
const collapsed = computed(
  () =>
    !!menu && !menu.horizontal.value && menu.collapse.value && !(parent?.popup.value ?? false),
)

const indexPath = computed<JeMenuIndex[]>(() => [...(parent?.path.value ?? []), props.index])

const select = () => {
  if (props.disabled) return
  menu?.select(props.index, indexPath.value)
  if (parent?.popup.value) parent.closePopup()
}

const onKeydown = (event: KeyboardEvent) => {
  if (props.disabled) return
  // 空格键的 event.key 是单个空格字符
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    select()
  }
}
</script>

<template>
  <div
    class="je-menu-item"
    :class="{ 'is-active': active, 'is-disabled': disabled, 'is-collapse': collapsed }"
    role="menuitem"
    :tabindex="disabled ? -1 : 0"
    :aria-disabled="disabled || undefined"
    :aria-current="active ? 'page' : undefined"
    @click="select"
    @keydown="onKeydown"
  >
    <JeTooltip class="je-menu-item__tip" placement="right" :disabled="!collapsed">
      <span class="je-menu-item__body">
        <span v-if="icon" class="je-menu-item__icon">
          <JeIcon :name="icon" :size="18" />
        </span>
        <span class="je-menu-item__label"><slot name="title"><slot /></slot></span>
      </span>
      <template #content><slot name="title"><slot /></slot></template>
    </JeTooltip>
  </div>
</template>

<style scoped>
.je-menu-item {
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: 10px 14px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: background var(--je-duration) ease, color var(--je-duration) ease;
}

.je-menu-item:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-menu-item:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

/* 选中只换文字颜色，不铺背景：底色留给 hover，两者叠在一起会变成双层高亮 */
.je-menu-item.is-active {
  color: color-mix(in srgb, var(--je-primary) 70%, white);
  font-weight: 600;
}

.je-menu-item.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-menu-item__tip {
  flex: 1 1 auto;
  min-width: 0;
}

.je-menu-item__body {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.je-menu-item__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--je-text-faint);
  transition: color var(--je-duration) ease;
}

/* 图标跟着文字一起变色，选中态与文字保持同一个色 */
.je-menu-item.is-active .je-menu-item__icon {
  color: color-mix(in srgb, var(--je-primary) 70%, white);
}

.je-menu-item:hover .je-menu-item__icon {
  color: var(--je-text);
}

.je-menu-item__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 折叠态：只剩图标居中显示（Tooltip 里的文字不受此规则影响，它是被传送出去的） */
.je-menu-item.is-collapse {
  justify-content: center;
  padding: 10px 0;
}

.je-menu-item.is-collapse .je-menu-item__tip {
  flex: 0 0 auto;
}

.je-menu-item.is-collapse .je-menu-item__label {
  display: none;
}

@media (max-width: 768px) {
  .je-menu-item {
    min-height: 48px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-menu-item,
  .je-menu-item__icon {
    transition: none;
  }
}
</style>
