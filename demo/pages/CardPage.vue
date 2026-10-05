<script setup lang="ts">
import { JeCard } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'
</script>

<template>
  <DemoPage title="Card 卡片" description="毛玻璃容器，带一次性入场动画（scale 0.85 → 1，带回弹）。">
    <DemoBlock title="基础卡片">
      <je-card>
        <h2 class="card__title">果冻卡片</h2>
        <p class="card__text">卡片内容放在默认插槽里，宽度自适应，最大 480px。</p>
      </je-card>
    </DemoBlock>

    <DemoBlock title="内容自适应">
      <je-card>
        <p class="card__text">卡片内部不做任何布局约束，交给使用方自己决定。</p>
        <p class="card__text">入场动画走 CSS keyframes，后台标签页也不会停在半路。</p>
      </je-card>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.card__title {
  margin: 0 0 8px;
  font-size: 20px;
  color: var(--je-text);
}

.card__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
  color: var(--je-text-muted);
}

.card__text + .card__text {
  margin-top: 10px;
}
</style>