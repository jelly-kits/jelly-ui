<script setup lang="ts">
import { JeBacktop } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage
    title="Backtop 回到顶部"
    description="监听目标容器滚动，超过阈值后出现，点击平滑回顶（系统开启「减弱动效」时改为瞬间跳转）。窄屏自动贴边并避开安全区。"
    hide-backtop
  >
    <DemoBlock title="基础用法" description="target 指向文档站的主滚动区；把它往下滚即可看到按钮。">
      <div class="filler">向下滚动右侧内容区…</div>
      <je-backtop target="#doc-scroll" />
    </DemoBlock>

    <DemoBlock
      title="监听指定容器"
      description="target 传 CSS 选择器，滚动该容器内内容即可触发（本例按钮放在稍高一点的位置避免与上例重叠）。"
    >
      <div id="backtop-demo-scroll" class="scroll-area">
        <p v-for="index in 12" :key="index" class="scroll-line">第 {{ index }} 行内容</p>
      </div>
      <je-backtop target="#backtop-demo-scroll" :visibility-height="120" :bottom="104" />
    </DemoBlock>

    <DemoBlock title="自定义阈值与位置" description="visibilityHeight=60，右下角间距均为 80px。">
      <div class="filler filler--short">阈值很小，内容区稍微滚动就会出现。</div>
      <je-backtop target="#doc-scroll" :visibility-height="60" :right="80" :bottom="80" />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.filler {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 320px;
  font-size: 13px;
  color: var(--je-text-faint);
  border: 1px dashed var(--je-border-color);
  border-radius: var(--je-radius);
}

.filler--short {
  height: 120px;
}

.scroll-area {
  height: 180px;
  padding: 8px 14px;
  overflow-y: auto;
  border: var(--je-border);
  border-radius: var(--je-radius);
  -webkit-overflow-scrolling: touch;
}

.scroll-line {
  margin: 0;
  padding: 10px 0;
  font-size: 13px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>
