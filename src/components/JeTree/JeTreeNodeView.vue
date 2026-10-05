<script setup lang="ts">
import { computed, inject } from 'vue'
import { JeIcon } from '../JeIcon'
import Self from './JeTreeNodeView.vue'
import { JE_TREE_CONTEXT, type JeTreeNode } from './types'

defineOptions({ name: 'JeTreeNodeView' })

const props = withDefaults(defineProps<{ node: JeTreeNode; level?: number }>(), { level: 1 })

const ctx = inject(JE_TREE_CONTEXT)!

const checkable = ctx.checkable
const hasChildren = computed(() => !!props.node.children?.length)
const isExpanded = computed(() => ctx.isExpanded(props.node.key))
const isSelected = computed(() => ctx.isSelected(props.node.key))
const isChecked = computed(() => ctx.isChecked(props.node.key))
const isIndeterminate = computed(() => ctx.isIndeterminate(props.node))
const isActive = computed(() => ctx.isActive(props.node.key))

/** 层级缩进由 padding-left 承担，行本身始终占满整行便于点选 */
const rowStyle = computed(() => ({ paddingLeft: `${(props.level - 1) * 18 + 10}px` }))
</script>

<template>
  <div class="je-tree__item" role="none">
    <div
      class="je-tree__node"
      :class="{ 'is-selected': isSelected, 'is-disabled': node.disabled }"
      :data-tree-key="node.key"
      role="treeitem"
      :aria-level="level"
      :aria-expanded="hasChildren ? isExpanded : undefined"
      :aria-selected="isSelected"
      :aria-checked="checkable ? (isChecked ? true : isIndeterminate ? 'mixed' : false) : undefined"
      :aria-disabled="node.disabled || undefined"
      :tabindex="isActive ? 0 : -1"
      :style="rowStyle"
      @click="ctx.onNodeClick(node)"
      @focus="ctx.setActive(node.key)"
    >
      <button
        v-if="hasChildren"
        type="button"
        class="je-tree__arrow"
        :class="{ 'is-expanded': isExpanded }"
        tabindex="-1"
        :aria-label="isExpanded ? `收起 ${node.label}` : `展开 ${node.label}`"
        @click.stop="ctx.toggleExpand(node)"
      >
        <JeIcon name="chevron-right" :size="14" />
      </button>
      <span v-else class="je-tree__arrow is-placeholder" aria-hidden="true" />

      <span
        v-if="checkable"
        class="je-tree__checkbox"
        :class="{ 'is-checked': isChecked, 'is-indeterminate': isIndeterminate }"
        aria-hidden="true"
        @click.stop="ctx.toggleCheck(node)"
      >
        <JeIcon v-if="isChecked" name="check" :size="12" />
        <span v-else-if="isIndeterminate" class="je-tree__checkbox-dash" />
      </span>

      <JeIcon v-if="node.icon" :name="node.icon" :size="16" class="je-tree__icon" />
      <span class="je-tree__label">{{ node.label }}</span>
    </div>

    <div v-if="hasChildren && isExpanded" class="je-tree__children" role="group">
      <Self
        v-for="child in node.children ?? []"
        :key="child.key"
        :node="child"
        :level="level + 1"
      />
    </div>
  </div>
</template>

<style scoped>
.je-tree__node {
  display: flex;
  align-items: center;
  gap: 6px;
  box-sizing: border-box;
  min-height: 40px;
  padding-right: 10px;
  font-size: 14px;
  color: var(--je-text-muted);
  border-radius: var(--je-radius-sm);
  cursor: pointer;
  outline: none;
  transition: background 0.2s ease, color 0.2s ease;
}

.je-tree__node:hover {
  color: var(--je-text);
  background: var(--je-surface-hover);
}

.je-tree__node.is-selected {
  font-weight: 600;
  color: var(--je-text);
  background: color-mix(in srgb, var(--je-primary) 30%, transparent);
}

.je-tree__node:focus-visible {
  outline: 2px solid var(--je-primary);
  outline-offset: -2px;
}

.je-tree__node.is-disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.je-tree__arrow {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  padding: 0;
  color: var(--je-text-faint);
  background: none;
  border: none;
  cursor: pointer;
  transition: transform 0.25s var(--je-ease-overshoot), color 0.2s ease;
}

.je-tree__arrow.is-expanded {
  transform: rotate(90deg);
}

.je-tree__arrow.is-placeholder {
  cursor: default;
}

/* 自绘勾选框：勾选 / 半选都由主色现算 */
.je-tree__checkbox {
  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  /* 勾只在选中 / 半选（渐变底）时出现，固定浅色 */
  color: var(--je-text-on-color);
  border: 2px solid var(--je-border-color);
  border-radius: 6px;
  transition: border-color 0.2s ease, background 0.2s ease;
}

.je-tree__checkbox.is-checked,
.je-tree__checkbox.is-indeterminate {
  background: linear-gradient(135deg, var(--je-primary), var(--je-primary-end));
  border-color: transparent;
}

.je-tree__checkbox-dash {
  width: 8px;
  height: 2px;
  /* 半选横杠压在渐变底上，固定浅色 */
  background: var(--je-text-on-color);
  border-radius: 2px;
}

.je-tree__icon {
  color: var(--je-text-faint);
}

.je-tree__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 窄屏：行高热区不小于 44px */
@media (max-width: 768px) {
  .je-tree__node {
    min-height: 44px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .je-tree__node,
  .je-tree__arrow,
  .je-tree__checkbox {
    transition: none;
  }
}
</style>
