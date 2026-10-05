<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JePopconfirm } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const result = ref('尚未操作')

const types = ['primary', 'danger', 'warning'] as const

const typeLabel: Record<(typeof types)[number], string> = {
  primary: '主色',
  danger: '危险',
  warning: '警告',
}

const confirmOpen = ref(false)
</script>

<template>
  <DemoPage
    title="Popconfirm 气泡确认框"
    description="点击触发的小型确认浮层，确认 / 取消分别抛出事件。窄屏自动切换为贴底弹层：可下拉关闭、锁定页面滚动、预留安全区，按钮热区不小于 44px。"
  >
    <DemoBlock title="基础用法" description="点击触发元素展开，按 Esc 或点击外部也会关闭。">
      <je-popconfirm
        title="删除确认"
        content="删除后无法恢复，确定要继续吗？"
        @confirm="result = '已确认'"
        @cancel="result = '已取消'"
      >
        <je-button variant="ghost">删除</je-button>
      </je-popconfirm>
      <p class="state">最近一次操作：{{ result }}</p>
    </DemoBlock>

    <DemoBlock title="语义类型" description="type 决定确认按钮的配色，取消按钮始终为次要样式。">
      <div class="row">
        <je-popconfirm
          v-for="item in types"
          :key="item"
          :type="item"
          :title="`${typeLabel[item]}操作`"
          content="确认后会立刻生效。"
          @confirm="result = `确认了${typeLabel[item]}操作`"
        >
          <je-button variant="ghost">{{ typeLabel[item] }}</je-button>
        </je-popconfirm>
      </div>
    </DemoBlock>

    <DemoBlock title="自定义文案与双向绑定" description="confirmText / cancelText 可改写按钮文案，v-model 控制显隐。">
      <je-popconfirm
        v-model="confirmOpen"
        title="提交表单"
        confirm-text="提交"
        cancel-text="再想想"
        placement="bottom"
        :width="240"
      >
        <template #content>当前为受控模式：{{ confirmOpen ? '已展开' : '已收起' }}</template>
        <je-button variant="ghost">提交</je-button>
      </je-popconfirm>
    </DemoBlock>

    <DemoBlock title="移动端" description="窄屏（≤768px）下气泡变成贴底弹层，带拖拽把手，向下拖动即可关闭。">
      <p class="state">把视口缩到 768px 以下体验底部弹层形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
