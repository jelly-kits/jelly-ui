<script setup lang="ts">
defineOptions({ name: 'JeCellGroup' })

withDefaults(
  defineProps<{
    /** 分组标题 */
    title?: string
    /** 分组标题下方的说明 */
    description?: string
    /** 内嵌模式：整体收成一张带边框和圆角的卡片，并在左右留白 */
    inset?: boolean
    /** 分组内容区是否铺一层底色 */
    surface?: boolean
  }>(),
  { title: undefined, description: undefined, inset: false, surface: true },
)
</script>

<template>
  <section class="je-cell-group" :class="{ 'is-inset': inset }">
    <h3 v-if="title || $slots.title" class="je-cell-group__title">
      <slot name="title">{{ title }}</slot>
    </h3>
    <p v-if="description" class="je-cell-group__desc">{{ description }}</p>

    <div class="je-cell-group__body" :class="{ 'has-surface': surface }">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.je-cell-group {
  font-family: inherit;
}

.je-cell-group__title {
  margin: 0 0 8px;
  padding: 0 16px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--je-text-faint);
}

.je-cell-group__desc {
  margin: 0 0 8px;
  padding: 0 16px;
  font-size: 12px;
  line-height: 1.5;
  color: var(--je-text-faint);
}

.je-cell-group__body {
  border-radius: var(--je-radius-lg);
}

.je-cell-group__body.has-surface {
  background: var(--je-surface);
}

/* 分组内最后一项不再画分隔线，否则会在卡片边缘多出一条悬空的线 */
.je-cell-group__body > :deep(.je-cell:last-child::after) {
  display: none;
}

/* 内嵌模式：卡片自带边框，并在左右留出边距 */
.je-cell-group.is-inset {
  margin: 0 16px;
}

.je-cell-group.is-inset .je-cell-group__body {
  overflow: hidden;
  border: var(--je-border);
}
</style>
