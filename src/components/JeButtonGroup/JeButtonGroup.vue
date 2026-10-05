<script setup lang="ts">
import { provide } from 'vue'
import { jeButtonGroupKey, type JeButtonSize, type JeButtonType } from '../JeButton/types'

defineOptions({ name: 'JeButtonGroup' })

const props = withDefaults(
  defineProps<{
    /** 组内按钮的默认语义类型，子按钮可用自身 type / variant 覆盖 */
    type?: JeButtonType
    /** 组内按钮的默认尺寸，子按钮可用自身 size 覆盖 */
    size?: JeButtonSize
    /** 排列方向 */
    direction?: 'horizontal' | 'vertical'
  }>(),
  { direction: 'horizontal' },
)

provide(jeButtonGroupKey, {
  getSize: () => props.size,
  getType: () => props.type,
})
</script>

<template>
  <div
    class="je-button-group"
    :class="{ 'je-button-group--vertical': direction === 'vertical' }"
    role="group"
  >
    <slot />
  </div>
</template>

<style scoped>
.je-button-group {
  display: inline-flex;
  vertical-align: middle;
}

.je-button-group--vertical {
  flex-direction: column;
}

/* 组内按钮首尾相扣：压掉内侧圆角，并用 -1px 让相邻描边重合而不是叠成 2px */
.je-button-group > :deep(.je-button) {
  border-radius: 0;
}

.je-button-group > :deep(.je-button:not(:first-child)) {
  margin-left: -1px;
}

/* hover / 聚焦的按钮提到最上层，否则重合的那条边会盖住它 */
.je-button-group > :deep(.je-button:hover:not(:disabled)),
.je-button-group > :deep(.je-button:focus-visible) {
  z-index: 2;
}

.je-button-group > :deep(.je-button:first-child) {
  border-radius: var(--je-radius-lg) 0 0 var(--je-radius-lg);
}

.je-button-group > :deep(.je-button:last-child) {
  border-radius: 0 var(--je-radius-lg) var(--je-radius-lg) 0;
}

.je-button-group > :deep(.je-button:first-child:last-child) {
  border-radius: var(--je-radius-lg);
}

/* 纵向：改成上下相扣，圆角换到上下的两端 */
.je-button-group--vertical > :deep(.je-button:not(:first-child)) {
  margin-top: -1px;
  margin-left: 0;
}

.je-button-group--vertical > :deep(.je-button:first-child) {
  border-radius: var(--je-radius-lg) var(--je-radius-lg) 0 0;
}

.je-button-group--vertical > :deep(.je-button:last-child) {
  border-radius: 0 0 var(--je-radius-lg) var(--je-radius-lg);
}

.je-button-group--vertical > :deep(.je-button:first-child:last-child) {
  border-radius: var(--je-radius-lg);
}
</style>
