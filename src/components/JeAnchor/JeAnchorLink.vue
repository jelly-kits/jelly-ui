<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted } from 'vue'
import { jeAnchorKey } from './types'

defineOptions({ name: 'JeAnchorLink' })

const props = withDefaults(
  defineProps<{
    /** 目标选择器，如 #section-1 */
    href: string
    /** 文字，也可用默认插槽 */
    title?: string
  }>(),
  { title: '' },
)

const context = inject(jeAnchorKey, null)

/** 激活态由父级注入的 activeHref 响应式判断，父级不命令式改 class */
const isActive = computed(() => context?.activeHref.value === props.href)
const isHorizontal = computed(() => context?.direction.value === 'horizontal')

/** 脱离 JeAnchor 单独使用时，保留原生跳转行为 */
const onClick = (event: MouseEvent) => {
  if (!context) return
  event.preventDefault()
  context.scrollTo(props.href)
}

onMounted(() => context?.registerLink(props.href))
onBeforeUnmount(() => context?.unregisterLink(props.href))
</script>

<template>
  <li class="je-anchor__item">
    <a
      class="je-anchor__link"
      :class="{ 'is-active': isActive, 'je-anchor__link--horizontal': isHorizontal }"
      :href="href"
      :aria-current="isActive ? 'location' : undefined"
      @click="onClick"
    >
      <slot>{{ title }}</slot>
    </a>
  </li>
</template>

<style scoped>
.je-anchor__item {
  flex: 0 0 auto;
}

.je-anchor__link {
  position: relative;
  display: flex;
  align-items: center;
  box-sizing: border-box;
  min-height: 44px;
  padding: 8px 14px 8px 18px;
  font-family: inherit;
  font-size: 14px;
  color: var(--je-text-muted);
  white-space: nowrap;
  text-decoration: none;
  border-radius: var(--je-radius-sm);
  outline: none;
  cursor: pointer;
  transition: color var(--je-duration) ease, background var(--je-duration) ease;
}

/* 左侧指示条：纵向锚点的朝向 */
.je-anchor__link::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 6px;
  width: 3px;
  height: 0;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-radius: 999px;
  transform: translateY(-50%);
  transition: height 0.28s var(--je-ease-overshoot);
}

.je-anchor__link:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-anchor__link.is-active {
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 14%, transparent);
}

.je-anchor__link.is-active::before {
  height: 18px;
}

.je-anchor__link:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}

/* 横向锚点：指示条移到下方 */
.je-anchor__link--horizontal {
  padding: 10px 14px 12px;
}

.je-anchor__link--horizontal::before {
  top: auto;
  bottom: 4px;
  left: 50%;
  width: 0;
  height: 3px;
  transform: translateX(-50%);
  transition: width 0.28s var(--je-ease-overshoot);
}

.je-anchor__link--horizontal.is-active::before {
  width: 20px;
  height: 3px;
}

/* 窄屏没有 hover，激活态由滚动位置驱动 */
@media (max-width: 768px) {
  .je-anchor__link:hover {
    background: transparent;
  }

  .je-anchor__link.is-active:hover {
    background: color-mix(in srgb, var(--je-primary) 14%, transparent);
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-anchor__link,
  .je-anchor__link::before {
    transition: none;
  }
}
</style>
