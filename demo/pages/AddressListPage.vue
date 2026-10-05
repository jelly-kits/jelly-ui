<script setup lang="ts">
import { ref } from 'vue'
import { JeAddressList, type JeAddressItem } from '@jelly-kits/jelly-ui'
import DemoBlock from '../components/DemoBlock.vue'
import DemoPage from '../components/DemoPage.vue'

const list = ref<JeAddressItem[]>([
  {
    id: 1,
    name: '张伟',
    tel: '138****8888',
    address: '浙江省杭州市西湖区文三路 100 号天堂软件园 A 座 12 层',
    isDefault: true,
    tag: '公司',
  },
  {
    id: 2,
    name: '李娜',
    tel: '139****6666',
    address: '江苏省南京市玄武区中山东路 200 号',
    tag: '家',
  },
  {
    id: 3,
    name: '王强',
    tel: '137****3333',
    address: '广东省深圳市南山区科技园南区高新南一道 18 号',
  },
])

const selected = ref('')
const log = ref('暂无')

const onSelect = (item: JeAddressItem) => {
  selected.value = `${item.name} ${item.tel}`
}

const onEdit = (item: JeAddressItem) => {
  log.value = `编辑：${item.name}`
}

const onDelete = (item: JeAddressItem, index: number) => {
  log.value = `删除：${item.name}`
  list.value.splice(index, 1)
}

const onSetDefault = (item: JeAddressItem) => {
  list.value.forEach((row) => {
    row.isDefault = row.id === item.id
  })
  log.value = `已将「${item.name}」设为默认`
}
</script>

<template>
  <DemoPage
    title="AddressList 地址列表"
    description="收货地址列表卡片，展示姓名 / 电话 / 详细地址与默认标记，并提供编辑、删除、设为默认操作。"
  >
    <DemoBlock title="基础用法" description="配合 showEdit / showDelete 展示底部操作区。">
      <je-address-list
        :list="list"
        show-edit
        show-delete
        @edit="onEdit"
        @delete="onDelete"
        @set-default="onSetDefault"
      />
      <p class="hint">{{ log }}</p>
    </DemoBlock>

    <DemoBlock title="可选中下单" description="switchable 开启后点击整卡派发 select，常用于选择收货地址。">
      <je-address-list :list="list" switchable @select="onSelect" />
      <p class="hint">{{ selected ? `已选择：${selected}` : '点击卡片选择地址' }}</p>
    </DemoBlock>

    <DemoBlock title="自定义默认标签" description="defaultTagText 替换默认地址前的角标文案。">
      <je-address-list :list="list" default-tag-text="default" show-edit />
    </DemoBlock>

    <DemoBlock title="禁用状态" description="禁用后不可选中，也不可编辑 / 删除 / 设默认。">
      <je-address-list :list="list" disabled show-edit show-delete switchable />
    </DemoBlock>
  </DemoPage>
</template>

<style scoped>
.hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: var(--je-text-faint);
}
</style>
