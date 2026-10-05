<script setup lang="ts">
defineOptions({ name: 'JeText' })

withDefaults(
  defineProps<{
    type?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
    size?: 'small' | 'default' | 'large'
    /** 渲染标签，默认 span */
    tag?: string
    bold?: boolean
    /** 单行省略 */
    truncated?: boolean
  }>(),
  { type: 'default', size: 'default', tag: 'span', bold: false, truncated: false },
)
</script>

<template>
  <component
    :is="tag"
    class="je-text"
    :class="[
      `je-text--${type}`,
      `je-text--${size}`,
      { 'is-bold': bold, 'is-truncated': truncated },
    ]"
  >
    <slot />
  </component>
</template>

<style scoped>
.je-text {
  color: var(--je-text-muted);
}

.je-text--primary {
  color: color-mix(in srgb, var(--je-primary) 70%, white);
}

.je-text--success {
  color: color-mix(in srgb, var(--je-success) 70%, white);
}

.je-text--warning {
  color: color-mix(in srgb, var(--je-warning) 75%, white);
}

.je-text--danger {
  color: color-mix(in srgb, var(--je-danger) 75%, white);
}

.je-text--info {
  color: color-mix(in srgb, var(--je-info) 70%, white);
}

.je-text--small {
  font-size: 12px;
}

.je-text--default {
  font-size: 14px;
}

.je-text--large {
  font-size: 16px;
}

.je-text.is-bold {
  font-weight: 600;
  color: var(--je-text);
}

.je-text.is-truncated {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}
</style>