<script setup lang="ts">
defineOptions({ name: 'JeTimeline' })

withDefaults(defineProps<{ reverse?: boolean }>(), { reverse: false })
</script>

<template>
  <ul class="je-timeline" :class="{ 'is-reverse': reverse }">
    <slot />
  </ul>
</template>

<style scoped>
.je-timeline {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  font-family: inherit;
  list-style: none;
}

/* 倒序：仅翻转显示顺序，节点竖线的起止仍由 DOM 首尾项决定 */
.je-timeline.is-reverse {
  flex-direction: column-reverse;
}
</style>
