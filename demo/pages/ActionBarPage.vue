<script setup lang="ts">
import { ref } from 'vue'
import { JeActionBar, JeActionBarButton, JeActionBarIcon } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const last = ref('暂无操作')
const submitting = ref(false)

const act = (name: string) => {
  last.value = name
}

const submit = () => {
  submitting.value = true
  last.value = '正在提交...'
  window.setTimeout(() => {
    submitting.value = false
    last.value = '提交完成'
  }, 1200)
}
</script>

<template>
  <DemoPage
    title="ActionBar 动作栏"
    description="详情页底部的操作栏：左侧放若干图标操作，右侧放一个主按钮，可固定在视口底部并预留安全区。"
  >
    <DemoBlock
      title="图标与主按钮"
      description="图标按钮垂直排布、热区不低于 44px，主按钮自动撑满剩余宽度。"
    >
      <je-action-bar>
        <je-action-bar-icon icon="message" text="客服" @click="act('客服')" />
        <je-action-bar-icon icon="star" text="收藏" @click="act('收藏')" />
        <je-action-bar-button type="primary" text="加入购物车" @click="act('加入购物车')" />
      </je-action-bar>
      <p class="state">{{ last }}</p>
    </DemoBlock>

    <DemoBlock
      title="角标与自定义颜色"
      description="badge 显示数字角标，dot 显示小红点，color 可单独覆盖某个图标的颜色。"
    >
      <je-action-bar>
        <je-action-bar-icon icon="bell" text="消息" :badge="5" @click="act('消息')" />
        <je-action-bar-icon icon="cart" text="购物车" dot @click="act('购物车')" />
        <je-action-bar-icon icon="share" text="分享" color="#f59e0b" @click="act('分享')" />
        <je-action-bar-button type="danger" text="立即购买" @click="act('立即购买')" />
      </je-action-bar>
      <p class="state">{{ last }}</p>
    </DemoBlock>

    <DemoBlock
      title="固定在底部"
      description="fixed 打开后固定在视口底部，placeholder 会在末尾补上等高占位。演示区用带 transform 的容器把固定效果限制在框内。"
    >
      <div class="scope">
        <p v-for="n in 8" :key="n" class="scope__line">内容第 {{ n }} 行</p>
        <je-action-bar fixed>
          <je-action-bar-icon icon="message" text="客服" @click="act('客服')" />
          <je-action-bar-icon icon="cart" text="购物车" :badge="2" @click="act('购物车')" />
          <je-action-bar-button type="primary" text="去结算" @click="act('去结算')" />
        </je-action-bar>
      </div>
    </DemoBlock>

    <DemoBlock
      title="禁用与加载态"
      description="disabled 的图标置灰且不派发点击，loading 的主按钮会转圈并阻止重复提交。"
    >
      <je-action-bar>
        <je-action-bar-icon icon="share" text="分享" disabled @click="act('分享')" />
        <je-action-bar-button
          type="success"
          text="提交订单"
          :loading="submitting"
          @click="submit"
        />
      </je-action-bar>
      <p class="state">{{ last }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.state {
  margin: 12px 0 0;
  font-size: 12px;
  color: var(--je-text-faint);
}

/* 容器带 transform 会成为内部 fixed 元素的包含块，把演示限制在框内 */
.scope {
  position: relative;
  height: 240px;
  overflow-y: auto;
  background: var(--je-surface);
  border: var(--je-border);
  border-radius: var(--je-radius);
  transform: translate(0);
}

.scope__line {
  margin: 0;
  padding: 12px 16px;
  font-size: 13px;
  color: var(--je-text-muted);
  border-bottom: var(--je-border);
}
</style>