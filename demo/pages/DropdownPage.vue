<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeDropdown, JeDropdownItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const last = ref('尚未选择')

const onCommand = (value: string | number) => {
  last.value = String(value)
}
</script>

<template>
  <DemoPage
    title="Dropdown 下拉菜单"
    description="带角色与键盘导航的下拉菜单：方向键移动高亮、Enter 选中、Esc 关闭。窄屏自动切换为底部弹出层，可下拉关闭并锁定页面滚动。"
  >
    <DemoBlock title="基础用法" description="点击触发，选中后抛出 command 事件并自动收起。">
      <je-dropdown @command="onCommand">
        <template #trigger>更多操作</template>
        <je-dropdown-item command="edit" icon="edit">编辑</je-dropdown-item>
        <je-dropdown-item command="copy" icon="copy">复制</je-dropdown-item>
        <je-dropdown-item command="share" icon="share">分享</je-dropdown-item>
      </je-dropdown>
      <p class="state">最近选择：{{ last }}</p>
    </DemoBlock>

    <DemoBlock title="禁用项与分隔线" description="divided 会与上一项之间画一条分隔线，disabled 项会被键盘遍历跳过。">
      <je-dropdown placement="bottom-start" :max-height="200" @command="onCommand">
        <template #trigger>行操作</template>
        <je-dropdown-item command="view" icon="eye">查看</je-dropdown-item>
        <je-dropdown-item command="download" icon="download">下载</je-dropdown-item>
        <je-dropdown-item command="archive" icon="inbox" disabled>归档（无权限）</je-dropdown-item>
        <je-dropdown-item command="delete" icon="trash" divided>删除</je-dropdown-item>
      </je-dropdown>
    </DemoBlock>

    <DemoBlock title="悬停触发与分裂按钮" description="trigger 设为 hover；splitButton 会把主按钮与箭头拆成两段。">
      <div class="row">
        <je-dropdown trigger="hover" placement="bottom-start" @command="onCommand">
          <template #trigger><span class="plain">悬停展开</span></template>
          <je-dropdown-item command="a" icon="star">收藏</je-dropdown-item>
          <je-dropdown-item command="b" icon="bookmark">标记</je-dropdown-item>
        </je-dropdown>

        <je-dropdown split-button placement="bottom-end" @command="onCommand">
          <template #trigger>
            <je-button>保存</je-button>
          </template>
          <je-dropdown-item command="save" icon="check">保存草稿</je-dropdown-item>
          <je-dropdown-item command="publish" icon="upload">发布</je-dropdown-item>
        </je-dropdown>
      </div>
    </DemoBlock>

    <DemoBlock title="移动端" description="窄屏（≤768px）下菜单变为底部弹出层，列表项高度不小于 44px，向下拖动把手即可关闭。">
      <p class="state">把视口缩到 768px 以下体验底部弹出层形态。</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.plain {
  display: inline-flex;
  align-items: center;
}

.state {
  margin: 10px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}
</style>
