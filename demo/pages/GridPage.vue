<script setup lang="ts">
import { ref } from 'vue'
import { JeButton, JeGrid, JeGridItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const column = ref(4)
const square = ref(false)
const clicked = ref('')
</script>

<template>
  <DemoPage
    title="Grid 宫格"
    description="把若干入口按等宽格子排列，常用于首页的功能导航。Grid 负责分列，GridItem 承载图标、文字与角标。"
  >
    <DemoBlock title="基础用法" description="默认 4 列，按容器宽度均分。">
      <je-grid>
        <je-grid-item icon="home" text="首页" />
        <je-grid-item icon="search" text="搜索" />
        <je-grid-item icon="bell" text="消息" />
        <je-grid-item icon="user" text="我的" />
      </je-grid>
    </DemoBlock>

    <DemoBlock title="列数与边框" description="column 控制列数，border 会画出相邻格子共用的细线。">
      <je-grid :column="column">
        <je-grid-item icon="star" text="收藏" />
        <je-grid-item icon="cart" text="购物车" />
        <je-grid-item icon="map-pin" text="地址" />
        <je-grid-item icon="tag" text="优惠券" />
        <je-grid-item icon="bookmark" text="会员卡" />
        <je-grid-item icon="shield" text="安全" />
        <je-grid-item icon="settings" text="设置" />
        <je-grid-item icon="question" text="帮助" />
      </je-grid>

      <div class="toolbar">
        <je-button size="small" @click="column = column === 4 ? 3 : 4">
          切换为 {{ column === 4 ? 3 : 4 }} 列
        </je-button>
        <je-button size="small" variant="ghost" @click="square = !square">
          {{ square ? '取消正方形' : '切换正方形' }}
        </je-button>
      </div>
    </DemoBlock>

    <DemoBlock title="正方形格子" description="square 让每个格子变成 1:1，图标居中后留白更均匀。">
      <je-grid :column="3" :border="false" :square="square">
        <je-grid-item icon="star" text="收藏" badge="12" />
        <je-grid-item icon="cart" text="购物车" :badge="3" />
        <je-grid-item icon="message" text="消息" dot />
      </je-grid>
    </DemoBlock>

    <DemoBlock title="点击事件" description="挂上 click 监听后格子会变成可点态，并支持键盘回车 / 空格触发。">
      <je-grid :column="4">
        <je-grid-item icon="home" text="首页" @click="clicked = '首页'" />
        <je-grid-item icon="search" text="搜索" @click="clicked = '搜索'" />
        <je-grid-item icon="bell" text="消息" @click="clicked = '消息'" />
        <je-grid-item icon="user" text="我的" @click="clicked = '我的'" />
      </je-grid>
      <p class="hint">最近点击：{{ clicked || '暂无' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 16px;
}

.hint {
  margin: 16px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
