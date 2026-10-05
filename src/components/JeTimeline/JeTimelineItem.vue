<script setup lang="ts">
import { computed, useSlots } from 'vue'
import JeIcon from '../JeIcon/JeIcon.vue'
import type { JeIconName } from '../JeIcon/icons'
import type { JeTimelineSize, JeTimelineType } from './types'

defineOptions({ name: 'JeTimelineItem' })

const props = withDefaults(
  defineProps<{
    timestamp?: string
    type?: JeTimelineType
    hollow?: boolean
    icon?: JeIconName
    size?: JeTimelineSize
  }>(),
  {
    timestamp: '',
    type: 'primary',
    hollow: false,
    icon: undefined,
    size: 'normal',
  },
)

const slots = useSlots()

/** 有自定义 dot 或图标时改用真实节点渲染，并隐藏伪元素圆点 */
const hasNode = computed(() => !!slots.dot || !!props.icon)

const iconSize = computed(() => (props.size === 'large' ? 12 : 10))
</script>

<template>
  <li
    class="je-timeline-item"
    :class="[
      `is-${type}`,
      `is-${size}`,
      { 'is-hollow': hollow, 'has-node': hasNode },
    ]"
  >
    <div v-if="timestamp || $slots.timestamp" class="je-timeline-item__timestamp">
      <slot name="timestamp">{{ timestamp }}</slot>
    </div>

    <div class="je-timeline-item__content"><slot /></div>

    <div v-if="hasNode" class="je-timeline-item__node">
      <slot name="dot">
        <JeIcon v-if="icon" :name="icon" :size="iconSize" />
      </slot>
    </div>
  </li>
</template>

<style scoped>
.je-timeline-item {
  position: relative;
  box-sizing: border-box;
  min-height: 44px;
  padding: 0 0 26px 32px;
  font-family: inherit;
  list-style: none;
}

/* 竖线：从圆点下方延伸到下一项的圆点处 */
.je-timeline-item::before {
  content: '';
  position: absolute;
  top: 18px;
  bottom: -4px;
  left: 5px;
  width: 2px;
  background: color-mix(in srgb, var(--je-timeline-color) 30%, transparent);
}

/* 节点圆点 */
.je-timeline-item::after {
  content: '';
  position: absolute;
  top: 4px;
  left: 0;
  box-sizing: border-box;
  width: 12px;
  height: 12px;
  background: var(--je-timeline-color);
  border-radius: 50%;
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--je-timeline-color) 16%, transparent);
}

/* 最后一项不再向下延伸；倒序时 DOM 首项才是视觉上的最后一项 */
.je-timeline-item:last-child::before {
  display: none;
}

.je-timeline.is-reverse .je-timeline-item:first-child::before {
  display: none;
}

.je-timeline-item.is-primary {
  --je-timeline-color: var(--je-primary);
}

.je-timeline-item.is-success {
  --je-timeline-color: var(--je-success);
}

.je-timeline-item.is-warning {
  --je-timeline-color: var(--je-warning);
}

.je-timeline-item.is-danger {
  --je-timeline-color: var(--je-danger);
}

.je-timeline-item.is-info {
  --je-timeline-color: var(--je-info);
}

/* 空心节点：透底 + 同色描边 */
.je-timeline-item.is-hollow::after {
  background: transparent;
  border: 2px solid var(--je-timeline-color);
  box-shadow: none;
}

/* 图标 / 自定义节点 */
.je-timeline-item__node {
  position: absolute;
  top: 2px;
  left: -2px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--je-timeline-color);
  background: var(--je-surface);
  border: 1px solid var(--je-timeline-color);
  border-radius: 50%;
}

.je-timeline-item.has-node::after {
  display: none;
}

.je-timeline-item__timestamp {
  margin-bottom: 4px;
  font-size: 12px;
  color: var(--je-text-faint);
}

.je-timeline-item__content {
  font-size: 14px;
  line-height: 1.6;
  color: var(--je-text);
}

/* 大尺寸：圆点与间距同步放大 */
.je-timeline-item.is-large {
  padding-left: 36px;
}

.je-timeline-item.is-large::before {
  top: 24px;
  left: 7px;
}

.je-timeline-item.is-large::after {
  width: 16px;
  height: 16px;
}

.je-timeline-item.is-large .je-timeline-item__node {
  width: 20px;
  height: 20px;
}

.je-timeline-item.is-large .je-timeline-item__timestamp {
  font-size: 13px;
}
</style>
