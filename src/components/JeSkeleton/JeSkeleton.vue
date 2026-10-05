<script setup lang="ts">
import JeSkeletonItem from './JeSkeletonItem.vue'

defineOptions({ name: 'JeSkeleton' })

withDefaults(
  defineProps<{
    /** 是否处于加载中：true 显示骨架，false 显示默认插槽 */
    loading?: boolean
    /** 微光动画 */
    animated?: boolean
    /** 文本行数 */
    rows?: number
    /** 左侧头像占位 */
    avatar?: boolean
    /** 顶部标题占位 */
    title?: boolean
    /** 圆角化，用于圆角卡片内 */
    round?: boolean
  }>(),
  {
    loading: true,
    animated: true,
    rows: 3,
    avatar: false,
    title: true,
    round: false,
  },
)

/** 固定的宽度数组，让各行有长短错落感，避免随机导致 SSR 水合不一致 */
const ROW_WIDTHS = ['100%', '92%', '96%', '88%', '94%']
</script>

<template>
  <div
    v-if="loading"
    class="je-skeleton"
    :class="{ 'is-animated': animated, 'is-round': round }"
    aria-hidden="true"
  >
    <div v-if="avatar" class="je-skeleton__avatar">
      <JeSkeletonItem variant="circle" :width="48" :height="48" />
    </div>

    <div class="je-skeleton__content">
      <JeSkeletonItem v-if="title" variant="text" width="42%" :height="18" />
      <JeSkeletonItem
        v-for="row in rows"
        :key="row"
        variant="text"
        :width="ROW_WIDTHS[(row - 1) % ROW_WIDTHS.length]"
      />
    </div>
  </div>

  <slot v-else />
</template>

<style scoped>
.je-skeleton {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
  font-family: inherit;
}

.je-skeleton__avatar {
  flex-shrink: 0;
}

.je-skeleton__content {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 12px;
  min-width: 0;
  padding-top: 2px;
}

/* animated=false 时关掉子项的微光动画 */
.je-skeleton:not(.is-animated) :deep(.je-skeleton__item) {
  animation: none;
}

/* round：除圆形头像外的所有块都改成胶囊圆角 */
.je-skeleton.is-round :deep(.je-skeleton__item:not(.je-skeleton__item--circle)) {
  border-radius: 999px;
}

/* 窄屏：头像缩小、行距收紧，避免占满整屏 */
@media (max-width: 768px) {
  .je-skeleton {
    gap: 12px;
  }

  .je-skeleton__content {
    gap: 10px;
  }
}
</style>
