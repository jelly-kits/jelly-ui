<script setup lang="ts">
import { computed, inject, useAttrs } from 'vue'
import { JeBadge } from '../JeBadge'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { jeGridKey } from './types'

defineOptions({ name: 'JeGridItem' })

withDefaults(
  defineProps<{
    /** 图标 */
    icon?: JeIconName
    /** 图标下方的文字 */
    text?: string
    /** 图标右上角的角标 */
    badge?: string | number
    /** 只显示一个小圆点角标 */
    dot?: boolean
  }>(),
  { icon: undefined, text: undefined, badge: undefined, dot: false },
)

const emit = defineEmits<{
  /** 点击格子；键盘回车 / 空格也会触发 */
  click: [event: MouseEvent | KeyboardEvent]
}>()

const grid = inject(jeGridKey, null)
const square = computed(() => grid?.getSquare() ?? false)

/** 显式挂 click 监听时才给出可点的手型与键盘可达性 */
const attrs = useAttrs()
const isClickable = computed(() => 'onClick' in attrs)

const onKeydown = (event: KeyboardEvent) => {
  if (!isClickable.value || (event.key !== 'Enter' && event.key !== ' ')) return
  event.preventDefault()
  emit('click', event)
}
</script>

<template>
  <div
    class="je-grid__item"
    :class="{ 'is-clickable': isClickable, 'is-square': square }"
    :role="isClickable ? 'button' : undefined"
    :tabindex="isClickable ? 0 : undefined"
    @click="emit('click', $event)"
    @keydown="onKeydown"
  >
    <div class="je-grid__content">
      <slot name="icon">
        <JeBadge v-if="icon" class="je-grid__icon" :value="badge" :is-dot="dot">
          <JeIcon :name="icon" :size="24" />
        </JeBadge>
      </slot>

      <span v-if="text || $slots.text" class="je-grid__text">
        <slot name="text">{{ text }}</slot>
      </span>

      <slot />
    </div>
  </div>
</template>

<style scoped>
.je-grid__item {
  position: relative;
  box-sizing: border-box;
  background: transparent;
  transition: background var(--je-duration) ease;
}

.je-grid__content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 78px;
  padding: 14px 8px;
  font-size: 13px;
  line-height: 1.35;
  color: var(--je-text-muted);
  text-align: center;
  overflow-wrap: anywhere;
}

/* 正方形：靠比例撑高，不再依赖 min-height */
.je-grid__item.is-square .je-grid__content {
  min-height: 0;
  aspect-ratio: 1 / 1;
}

.je-grid__icon {
  color: var(--je-text);
}

.je-grid__text {
  display: block;
  max-width: 100%;
}

.je-grid__item.is-clickable {
  cursor: pointer;
}

.je-grid__item.is-clickable:hover {
  background: var(--je-surface-hover);
}

.je-grid__item.is-clickable:active {
  background: color-mix(in srgb, var(--je-primary) 16%, transparent);
}

.je-grid__item.is-clickable:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

@media (max-width: 768px) {
  .je-grid__content {
    min-height: 86px;
    padding: 16px 8px;
  }
}
</style>
