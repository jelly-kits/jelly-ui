<script setup lang="ts">
defineOptions({ name: 'JeMain' })
</script>

<template>
  <main class="je-main">
    <slot />
  </main>
</template>

<style scoped>
.je-main {
  /* 占满顶栏 / 底栏 / 侧栏之外的剩余空间 */
  display: block;
  flex: 1;
  flex-basis: auto;
  box-sizing: border-box;
  min-width: 0;
  padding: var(--je-main-padding, 20px);
  overflow: auto;
}

/* 窄屏收窄内边距 */
@media (max-width: 768px) {
  .je-main {
    padding: var(--je-main-padding, 16px);
  }
}
</style>
