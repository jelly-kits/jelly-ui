<script setup lang="ts">
import { ref } from 'vue'
import { JeSwipeCell } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const position = ref<'left' | 'right' | ''>('')
const alonePosition = ref<'left' | 'right' | ''>('')
const log = ref('暂无')

const onDelete = (name: string) => {
  log.value = `删除：${name}`
}
</script>

<template>
  <DemoPage
    title="SwipeCell 滑动单元格"
    description="左右滑动唤出操作按钮的列表项，带轴向锁定：竖向意图会交还给页面滚动，不抢滚动手势。"
  >
    <DemoBlock title="基础用法" description="左侧滑出收藏按钮，右侧滑出删除按钮，v-model 记录当前展开的一侧。">
      <je-swipe-cell v-model="position">
        <div class="cell">向左滑有删除，向右滑有收藏</div>
        <template #left>
          <button type="button" class="action action--primary">收藏</button>
        </template>
        <template #right>
          <button type="button" class="action action--danger" @click="onDelete('第一条')">删除</button>
        </template>
      </je-swipe-cell>
      <p class="hint">当前展开：{{ position || '未展开' }}</p>
    </DemoBlock>

    <DemoBlock title="列表中的多项" description="每一项独立维护自己的展开状态。">
      <je-swipe-cell v-for="index in 3" :key="index" class="item">
        <div class="cell">{{ index }} 号消息</div>
        <template #right>
          <button type="button" class="action action--danger" @click="onDelete(`${index} 号消息`)">
            删除
          </button>
        </template>
      </je-swipe-cell>
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="固定操作区宽度" description="leftWidth / rightWidth 不传则按内容自适应，传数字按 px 处理。">
      <je-swipe-cell v-model="alonePosition" :right-width="120">
        <div class="cell">右侧操作区固定 120px</div>
        <template #right>
          <button type="button" class="action action--danger action--wide">删除</button>
        </template>
      </je-swipe-cell>
    </DemoBlock>

    <DemoBlock title="禁用滑动">
      <je-swipe-cell disabled>
        <div class="cell">这一项不可滑动</div>
        <template #right>
          <button type="button" class="action action--danger">删除</button>
        </template>
      </je-swipe-cell>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.cell {
  padding: 15px;
  font-size: 14px;
  color: var(--je-text);
  background: var(--je-popup);
}

.action {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-width: 72px;
  padding: 0 18px;
  border: none;
  font-size: 14px;
  color: #fff;
  cursor: pointer;
}

.action--wide {
  width: 120px;
}

.action--primary {
  background: var(--je-primary);
}

.action--danger {
  background: var(--je-danger);
}

.item {
  margin-top: 10px;
}

.item:first-of-type {
  margin-top: 0;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
