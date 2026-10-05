<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { jeTabKey } from './types'

defineOptions({ name: 'JeTabItem' })

const props = withDefaults(
  defineProps<{
    /** 标题文字 */
    title?: string
    /** 唯一标识，缺省时按注册顺序自动生成 */
    name?: string | number
    /** 禁用后不可点选 */
    disabled?: boolean
    /** 角标内容 */
    badge?: string | number
    /** 是否显示小红点 */
    dot?: boolean
  }>(),
  {
    title: '',
    name: undefined,
    disabled: false,
    badge: undefined,
    dot: false,
  },
)

const ctx = inject(jeTabKey)
if (!ctx) throw new Error('JeTabItem 必须放在 JeTab 内使用')

const fallbackName = ctx.genName()
const name = computed(() => props.name ?? fallbackName)
const index = computed(() => ctx.getIndex(name.value))

const isActive = computed(() => ctx.isActive(name.value))
const stretch = computed(() => ctx.ellipsis.value)
const activeColor = computed(() => ctx.activeColor.value)
const inactiveColor = computed(() => ctx.inactiveColor.value)
const color = computed(() => (isActive.value ? activeColor.value : inactiveColor.value))
const showBadge = computed(() => !props.dot && props.badge !== undefined && props.badge !== '')

// 头部标题按钮 Teleport 到父级的标题容器里，于是「标题」与「内容」能各归其位
const navRef = ctx.navRef

const onClick = () => {
  if (props.disabled) return
  ctx.activate(name.value, index.value < 0 ? 0 : index.value)
}

onMounted(() => ctx.register(name.value, () => props.disabled))
onBeforeUnmount(() => ctx.unregister(name.value))
</script>

<template>
  <Teleport v-if="navRef" :to="navRef">
    <button
      type="button"
      class="je-tab__tab"
      :class="{ 'is-stretch': stretch, 'is-active': isActive, 'is-disabled': disabled }"
      role="tab"
      :aria-selected="isActive"
      :disabled="disabled"
      :style="{ color }"
      @click="onClick"
    >
      <span class="je-tab__title">{{ title }}</span>
      <span v-if="dot" class="je-tab__dot" aria-hidden="true" />
      <span v-else-if="showBadge" class="je-tab__badge">{{ badge }}</span>
    </button>
  </Teleport>

  <div class="je-tab-item" role="tabpanel" :aria-hidden="!isActive">
    <slot />
  </div>
</template>

<style scoped>
.je-tab__tab {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: 4px;
  box-sizing: border-box;
  min-height: 44px;
  padding: 0 16px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: var(--je-text-muted);
  white-space: nowrap;
  background: transparent;
  border: none;
  cursor: pointer;
  outline: none;
  transition: color var(--je-duration) ease;
}

/* 省略模式：等分宽度，标题超出省略 */
.je-tab__tab.is-stretch {
  flex: 1 1 0;
  min-width: 0;
  padding: 0 8px;
}

.je-tab__tab.is-active {
  font-weight: 700;
}

.je-tab__tab.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.je-tab__tab:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-tab__title {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.je-tab__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  font-size: 11px;
  font-weight: 600;
  line-height: 1;
  /* 红色实底上固定浅色文字 */
  color: var(--je-text-on-color);
  background: var(--je-danger);
  border-radius: 999px;
}

.je-tab__dot {
  width: 8px;
  height: 8px;
  background: var(--je-danger);
  border-radius: 50%;
}

/* 每一页都留在 DOM 里，由父级 track 统一控制位移 */
.je-tab-item {
  flex: 0 0 100%;
  box-sizing: border-box;
  width: 100%;
  min-width: 0;
  padding: 16px;
}

@media (max-width: 768px) {
  .je-tab-item {
    padding: 12px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-tab__tab {
    transition: none;
  }
}
</style>