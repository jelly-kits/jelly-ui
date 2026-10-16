<script setup lang="ts">
import { computed, ref } from 'vue'
import { JeButton, JeSpace } from '@jelly-kits/jelly-ui'
import { JeDragSort } from '@jelly-kits/jelly-ui/sortable'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

type DemoItem = {
  id: number
  name: string
  group: string
}

/** 造一份演示数据：每次调用返回新数组，各演示块互不影响 */
const makeItems = (): DemoItem[] => [
  { id: 1, name: '用户中心', group: '基础' },
  { id: 2, name: '订单管理', group: '业务' },
  { id: 3, name: '数据看板', group: '进阶' },
  { id: 4, name: '权限配置', group: '业务' },
  { id: 5, name: '操作日志', group: '基础' },
  { id: 6, name: '消息中心', group: '进阶' },
]

/** 内置列表模式：组件渲染列表容器，条目内容由插槽定制 */
const items = ref<DemoItem[]>(makeItems())

/** 手柄模式：只有手柄区域能拖 */
const handleItems = ref<DemoItem[]>(makeItems())

/** 外部容器模式：组件不渲染列表，只给这个元素接入拖拽 */
const externalItems = ref<DemoItem[]>(makeItems())

/** 多选：选中的 id 集合由 update:selectedIds 回传 */
const selectedIds = ref<Set<string | number>>(new Set())
const dragSortRef = ref<{ selectAll: () => void; clearSelection: () => void } | null>(null)

/** 拖拽后的顺序，写在示例下方方便对照 */
const orderText = computed(() => items.value.map((item) => item.name).join(' → '))
const selectedText = computed(() =>
  selectedIds.value.size ? [...selectedIds.value].join('、') : '未选中',
)
</script>

<template>
  <DemoPage
    title="DragSort 拖拽排序"
    description="把一份数组接上 v-model 就能拖拽排序：既可以用内置列表（插槽定制条目内容），也可以给页面里已有的容器接上手柄、多选整组拖拽与跟随鼠标的预览。"
  >
    <DemoBlock
      title="基础用法"
      description="v-model 绑定数组，拖拽结束后按新顺序回传；条目内容用 item 插槽定制，卡片宽度不足时自动换行。"
    >
      <je-drag-sort v-model="items" item-min-width="180px" height="240px">
        <template #item="{ item }">
          <span class="dot" />
          <span class="name">{{ item.name }}</span>
          <span class="tag">{{ item.group }}</span>
        </template>
      </je-drag-sort>
      <p class="state">当前顺序：{{ orderText }}</p>
    </DemoBlock>

    <DemoBlock
      title="多选整组拖拽"
      description="点击条目可多选（再次点击取消），拖动其中任意一条会带着整组一起移动；拖动时左上角跟随鼠标的预览会显示条数，选中变化通过 update:selectedIds 回传。"
    >
      <je-space class="toolbar">
        <je-button size="small" @click="dragSortRef?.selectAll()">全选</je-button>
        <je-button size="small" variant="ghost" @click="dragSortRef?.clearSelection()">清空选中</je-button>
      </je-space>
      <je-drag-sort
        ref="dragSortRef"
        v-model="items"
        item-min-width="180px"
        height="240px"
        @update:selected-ids="selectedIds = $event"
      >
        <template #item="{ item }">
          <span class="name">{{ item.name }}</span>
          <span class="tag">{{ item.group }}</span>
        </template>
      </je-drag-sort>
      <p class="state">已选中：{{ selectedText }}</p>
    </DemoBlock>

    <DemoBlock
      title="指定拖拽手柄"
      description="传 handle 后只有匹配该选择器的区域能发起拖拽，卡片其它位置可以正常放按钮 / 链接。"
    >
      <je-drag-sort v-model="handleItems" handle=".handle" item-min-width="180px" height="200px">
        <template #item="{ item }">
          <span class="handle" title="拖拽手柄">⠿</span>
          <span class="name">{{ item.name }}</span>
        </template>
      </je-drag-sort>
    </DemoBlock>

    <DemoBlock
      title="外部容器模式"
      description="传 target 指向页面里已有的容器，组件就不再渲染自己的列表，直接给这个元素接入拖拽；容器内的条目按位置与数据一一对应，不需要自己写 data-id。"
    >
      <div class="ext__list">
        <div v-for="item in externalItems" :key="item.id" class="ext__item">
          <span class="name">{{ item.name }}</span>
          <span class="tag">{{ item.group }}</span>
        </div>
      </div>
      <je-drag-sort v-model="externalItems" target=".ext__list" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.toolbar {
  margin-bottom: 12px;
}

.state {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-muted);
}

.name {
  flex: 1;
  min-width: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag {
  flex: none;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 12px;
  background: var(--je-surface-hover);
  color: var(--je-text-muted);
}

.dot {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--je-primary);
}

.handle {
  flex: none;
  font-size: 16px;
  line-height: 1;
  color: var(--je-text-faint);
  cursor: grab;
  user-select: none;
}

/* ---------- 外部容器模式 ---------- */
.ext__list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  max-height: 240px;
  overflow-y: auto;
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius-sm);
}

.ext__item {
  flex: 1 1 auto;
  min-width: 180px;
  max-width: 100%;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid var(--je-border-color);
  border-radius: var(--je-radius-sm);
  background: var(--je-surface);
  cursor: grab;
  user-select: none;
}

.ext__item:active {
  cursor: grabbing;
}
</style>
