<script setup lang="ts">
import { provide } from 'vue'
import { jeGridKey } from './types'

defineOptions({ name: 'JeGrid' })

const props = withDefaults(
  defineProps<{
    /** 每行几列 */
    column?: number
    /** 画出外框与格子之间的分隔线 */
    border?: boolean
    /** 单元格强制正方形，图标宫格用它 */
    square?: boolean
  }>(),
  { column: 4, border: true, square: false },
)

provide(jeGridKey, { getSquare: () => props.square })
</script>

<template>
  <div
    class="je-grid"
    :class="{ 'has-border': border }"
    :style="{ '--je-grid-column': column }"
  >
    <slot />
  </div>
</template>

<style scoped>
.je-grid {
  display: grid;
  grid-template-columns: repeat(var(--je-grid-column, 4), minmax(0, 1fr));
  font-family: inherit;
}

/* 外框只画上、左两条，每格再各自补右、下两条：合起来正好是一张完整网格，且相邻格子之间
   不会像「四面都画」那样叠成 2px 粗线 */
.je-grid.has-border {
  border-top: 1px solid var(--je-border-color);
  border-left: 1px solid var(--je-border-color);
}

.je-grid.has-border > :deep(.je-grid__item) {
  border-right: 1px solid var(--je-border-color);
  border-bottom: 1px solid var(--je-border-color);
}
</style>
