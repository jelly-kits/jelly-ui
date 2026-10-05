<script setup lang="ts">
import { computed } from 'vue'

defineOptions({ name: 'JeAside' })

const props = withDefaults(
  defineProps<{
    /** 侧边栏宽度，数字按 px 处理 */
    width?: string | number
  }>(),
  { width: 300 },
)

const style = computed(() => ({
  '--je-aside-width': typeof props.width === 'number' ? `${props.width}px` : props.width,
}))
</script>

<template>
  <aside class="je-aside" :style="style">
    <slot />
  </aside>
</template>

<style scoped>
.je-aside {
  box-sizing: border-box;
  /* 宽度固定，不随内容伸缩 */
  flex-shrink: 0;
  width: var(--je-aside-width, 300px);
  overflow: auto;
}
</style>
