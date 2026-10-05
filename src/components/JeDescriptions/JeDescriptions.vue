<script setup lang="ts">
import { computed, provide } from 'vue'
import { useIsMobile } from '../../core/useMediaQuery'
import {
  jeDescriptionsKey,
  type JeDescriptionsContext,
  type JeDescriptionsDirection,
  type JeDescriptionsSize,
} from './types'

defineOptions({ name: 'JeDescriptions' })

const props = withDefaults(
  defineProps<{
    title?: string
    column?: number
    border?: boolean
    direction?: JeDescriptionsDirection
    size?: JeDescriptionsSize
    labelWidth?: string | number
  }>(),
  {
    title: '',
    column: 3,
    border: false,
    direction: 'horizontal',
    size: 'default',
    labelWidth: undefined,
  },
)

const isMobile = useIsMobile()

/** 窄屏降为单列，避免标签与内容被挤成两行 */
const actualColumn = computed(() => (isMobile.value ? 1 : Math.max(1, props.column)))

provide(
  jeDescriptionsKey,
  computed<JeDescriptionsContext>(() => ({
    column: actualColumn.value,
    border: props.border,
    direction: props.direction,
    size: props.size,
    labelWidth: props.labelWidth,
  })),
)
</script>

<template>
  <div class="je-descriptions" :class="[`je-descriptions--${size}`, { 'is-border': border }]">
    <div v-if="title || $slots.title" class="je-descriptions__title">
      <slot name="title">{{ title }}</slot>
    </div>

    <div class="je-descriptions__body" :style="{ '--je-descriptions-column': actualColumn }">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.je-descriptions {
  box-sizing: border-box;
  font-family: inherit;
  color: var(--je-text-muted);
}

.je-descriptions__title {
  margin-bottom: 14px;
  font-size: 15px;
  font-weight: 600;
  color: var(--je-text);
}

.je-descriptions__body {
  display: grid;
  grid-template-columns: repeat(var(--je-descriptions-column, 1), minmax(0, 1fr));
  gap: 14px 24px;
}

/* 描边模式：父容器补左 / 上两条线，单元格各自画右 / 下，拼出完整表格 */
.je-descriptions.is-border .je-descriptions__body {
  gap: 0;
  overflow: hidden;
  border-top: var(--je-border);
  border-left: var(--je-border);
  border-radius: var(--je-radius-sm);
}

.je-descriptions--small {
  font-size: 12px;
}

.je-descriptions--small .je-descriptions__body {
  gap: 10px 18px;
}

.je-descriptions--large {
  font-size: 16px;
}

.je-descriptions--large .je-descriptions__body {
  gap: 18px 28px;
}
</style>
