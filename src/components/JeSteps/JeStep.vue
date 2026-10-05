<script setup lang="ts">
import { computed, inject, onBeforeUnmount, useId } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import { jeStepsKey, type JeStepStatus } from './types'

defineOptions({ name: 'JeStep' })

const props = withDefaults(
  defineProps<{
    title?: string
    description?: string
    icon?: JeIconName
    status?: JeStepStatus
  }>(),
  { title: '', description: '', icon: undefined, status: undefined },
)

const context = inject(jeStepsKey)
const uid = useId()

context?.registerStep(uid)
onBeforeUnmount(() => context?.unregisterStep(uid))

const index = computed(() => context?.indexOf(uid) ?? 0)
const active = computed(() => context?.getActive() ?? 0)
const last = computed(() => index.value === (context?.count() ?? 1) - 1)

/** 未显式指定 status 时，由「父级 active + 自身下标」推导 */
const status = computed<JeStepStatus>(() => {
  if (props.status) return props.status
  if (index.value < active.value) return context?.getFinishStatus() ?? 'finish'
  if (index.value === active.value) return context?.getProcessStatus() ?? 'process'
  return 'wait'
})

/** 本节点之后的连接线是否已走过 */
const filled = computed(() => index.value < active.value)

const iconName = computed<JeIconName | null>(() => {
  if (props.icon) return props.icon
  if (status.value === 'finish' || status.value === 'success') return 'check'
  if (status.value === 'error') return 'close'
  return null
})
</script>

<template>
  <div class="je-step" :class="[`is-${status}`, { 'is-filled': filled }]">
    <div class="je-step__head">
      <span class="je-step__node">
        <slot name="icon">
          <JeIcon v-if="iconName" :name="iconName" :size="16" />
          <template v-else>{{ index + 1 }}</template>
        </slot>
      </span>
    </div>

    <div v-if="!last" class="je-step__line" aria-hidden="true">
      <span class="je-step__line-inner" />
    </div>

    <div class="je-step__main">
      <div class="je-step__title">
        <slot name="title">{{ title }}</slot>
      </div>
      <div v-if="description || $slots.description" class="je-step__desc">
        <slot name="description">{{ description }}</slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.je-step {
  position: relative;
  box-sizing: border-box;
  min-width: 0;
}

/* 横向：各步等分 */
.je-steps--horizontal .je-step {
  flex: 1 1 0;
}

.je-step__head {
  position: relative;
  display: flex;
  align-items: center;
}

.je-step__node {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--je-step-node-size, 32px);
  height: var(--je-step-node-size, 32px);
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text-faint);
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: 50%;
  transition: color var(--je-duration) ease, background var(--je-duration) ease,
    border-color var(--je-duration) ease;
}

.je-step.is-process .je-step__node,
.je-step.is-finish .je-step__node,
.je-step.is-success .je-step__node {
  /* 序号压在品牌渐变上，固定浅色 */
  color: var(--je-text-on-color);
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

.je-step.is-process .je-step__node {
  box-shadow: 0 6px 18px color-mix(in srgb, var(--je-primary) 40%, transparent);
}

.je-step.is-error .je-step__node {
  /* 实色危险底上同样用浅色 */
  color: var(--je-text-on-color);
  background: var(--je-danger);
  border-color: transparent;
}

/* 连接线：底槽 + 进度条，进度色现算渐变 */
.je-step__line {
  position: absolute;
  background: var(--je-border-color);
}

.je-step__line-inner {
  display: block;
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  transition: width 0.3s var(--je-ease-out-back), height 0.3s var(--je-ease-out-back);
}

.je-steps--horizontal .je-step__line {
  top: calc(var(--je-step-node-size, 32px) / 2 - 1px);
  right: 4px;
  left: calc(var(--je-step-node-size, 32px) + 8px);
  height: 2px;
}

.je-steps--horizontal .je-step__line-inner {
  width: 0;
  height: 100%;
}

.je-steps--horizontal .je-step.is-filled .je-step__line-inner {
  width: 100%;
}

/* 居中排列时，节点居中，连接线要跨过半个步宽才能接到下一个节点 */
.je-steps--horizontal.is-align-center .je-step__head {
  justify-content: center;
}

.je-steps--horizontal.is-align-center .je-step__line {
  left: calc(50% + var(--je-step-node-size, 32px) / 2 + 4px);
  right: calc(4px + var(--je-step-node-size, 32px) / 2 - 50%);
}

.je-steps--horizontal.is-align-center .je-step__main {
  text-align: center;
}

.je-step__main {
  padding-top: 8px;
}

.je-step__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--je-text);
}

.je-step__desc {
  margin-top: 4px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--je-text-faint);
}

/* 纵向：节点在左，内容在右，连接线向下 */
.je-steps--vertical .je-step {
  min-height: var(--je-step-node-size, 32px);
  padding: 0 0 20px calc(var(--je-step-node-size, 32px) + 14px);
}

.je-steps--vertical .je-step:last-child {
  padding-bottom: 0;
}

.je-steps--vertical .je-step__head {
  position: absolute;
  top: 0;
  left: 0;
}

.je-steps--vertical .je-step__line {
  top: calc(var(--je-step-node-size, 32px) + 6px);
  bottom: 4px;
  left: calc(var(--je-step-node-size, 32px) / 2 - 1px);
  width: 2px;
}

.je-steps--vertical .je-step__line-inner {
  width: 100%;
  height: 0;
}

.je-steps--vertical .je-step.is-filled .je-step__line-inner {
  height: 100%;
}

.je-steps--vertical .je-step__main {
  padding-top: 6px;
}

/* simple：只留序号和标题，隐藏描述与连接线 */
.je-steps.is-simple .je-step {
  flex: 1 1 0;
}

.je-steps.is-simple .je-step__node {
  width: auto;
  height: auto;
  min-width: 0;
  color: var(--je-text-faint);
  background: none;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

.je-steps.is-simple .je-step.is-process .je-step__node {
  color: var(--je-text);
}

.je-steps.is-simple .je-step__line,
.je-steps.is-simple .je-step__desc {
  display: none;
}

.je-steps.is-simple .je-step__head {
  justify-content: flex-start;
}

.je-steps.is-simple .je-step__main {
  padding-top: 4px;
}

@media (max-width: 768px) {
  /* 横向滑动时节点需要固定宽度，否则会被挤压 */
  .je-steps--horizontal .je-step {
    flex: 0 0 auto;
    min-width: 140px;
  }

  .je-step__node {
    min-width: 44px;
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-step__node,
  .je-step__line-inner {
    transition: none;
  }
}
</style>
