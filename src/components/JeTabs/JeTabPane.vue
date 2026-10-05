<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useId, useSlots } from 'vue'
import { jeTabsKey, type JeTabName, type JeTabPaneState } from './types'

defineOptions({ name: 'JeTabPane' })

const props = withDefaults(
  defineProps<{
    name: JeTabName
    label?: string
    disabled?: boolean
    closable?: boolean
  }>(),
  { label: '', disabled: false, closable: false },
)

const slots = useSlots()
const context = inject(jeTabsKey)
const uid = useId()

/** 每次读取都取当前 props，父级用 computed 包裹后即可跟随响应式更新 */
const getState = (): JeTabPaneState => ({
  uid,
  name: props.name,
  label: props.label,
  disabled: props.disabled,
  closable: props.closable,
  labelRender: slots.label ? () => slots.label?.() : undefined,
})

context?.registerPane(uid, getState)
onBeforeUnmount(() => context?.unregisterPane(uid))

const active = computed(() => context?.isActive(props.name) ?? false)
</script>

<template>
  <div
    :id="`${uid}-panel`"
    v-show="active"
    class="je-tab-pane"
    role="tabpanel"
    :aria-labelledby="`${uid}-tab`"
    tabindex="0"
  >
    <slot />
  </div>
</template>

<style scoped>
.je-tab-pane {
  padding: 16px 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-muted);
  outline: none;
}

.je-tab-pane:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: 2px;
}
</style>
