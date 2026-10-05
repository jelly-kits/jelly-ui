<script setup lang="ts">
import { ref } from 'vue'
import { JeCoupon } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const picked = ref('')

const types = ['primary', 'success', 'warning', 'danger', 'info'] as const

const onPick = (title: string) => {
  picked.value = title
}
</script>

<template>
  <DemoPage
    title="Coupon 优惠券"
    description="移动端优惠券卡片，左侧渐变面额 + 右侧信息区，虚线撕口与角章表达已使用 / 已过期状态。"
  >
    <DemoBlock title="基础用法" description="面额、条件、有效期与角标都可以自由组合。">
      <je-coupon
        :value="20"
        title="新人专享券"
        condition="满 99 元可用"
        validity="2026.10.01 - 2026.10.31"
        tag="限时"
      />
    </DemoBlock>

    <DemoBlock title="五种语义色" description="type 决定左侧面额区的渐变配色。">
      <je-coupon
        v-for="item in types"
        :key="item"
        :type="item"
        :value="item === 'danger' ? 50 : 10"
        :title="`${item} 优惠券`"
        condition="满 100 元可用"
        validity="有效期至 2026.12.31"
      />
    </DemoBlock>

    <DemoBlock title="折扣券" description="value 传折扣值，unit 换成「折」。">
      <je-coupon :value="8.5" unit="折" type="warning" title="全场通用折扣券" condition="满 200 元可用" />
    </DemoBlock>

    <DemoBlock title="已使用 / 已过期" description="status 非 unused 时整卡置灰并盖上角章。">
      <je-coupon :value="30" status="used" title="已使用的优惠券" condition="满 199 元可用" />
      <je-coupon :value="15" status="expired" title="已过期的优惠券" condition="满 99 元可用" />
    </DemoBlock>

    <DemoBlock title="可点击选中" description="点击整卡派发 click，禁用后不可点击。">
      <je-coupon
        :value="25"
        type="success"
        title="点我试试"
        condition="满 120 元可用"
        @click="onPick('25 元券')"
      />
      <je-coupon :value="25" title="禁用状态" disabled />
      <p class="hint">{{ picked ? `已选中：${picked}` : '暂无选中' }}</p>
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.je-coupon + .je-coupon {
  margin-top: 12px;
}

.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
