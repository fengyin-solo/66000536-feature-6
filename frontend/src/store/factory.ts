import { defineStore } from 'pinia'
import { ref, onUnmounted } from 'vue'
import type { FactoryData, GroupBy } from '@/types'

const GROUP_BY_STORAGE_KEY = 'fault-overview-group-by'

function loadGroupBy(): GroupBy {
  const saved = localStorage.getItem(GROUP_BY_STORAGE_KEY)
  return saved === 'area' || saved === 'shift' ? saved : 'type'
}

export const useFactoryStore = defineStore('factory', () => {
  const data = ref<FactoryData | null>(null)
  const ws = ref<WebSocket | null>(null)
  const connected = ref(false)

  // 故障分布概览的分组方式与当前选中的分组
  const groupBy = ref<GroupBy>(loadGroupBy())
  const selectedGroup = ref<string | null>(null)

  function setGroupBy(mode: GroupBy) {
    groupBy.value = mode
    localStorage.setItem(GROUP_BY_STORAGE_KEY, mode)
    selectedGroup.value = null
  }

  function selectGroup(key: string | null) {
    selectedGroup.value = key
  }

  function connect() {
    if (ws.value) return
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:'
    const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`)
    s.onopen = () => { connected.value = true; console.log('WS connected') }
    s.onmessage = (e) => {
      try { data.value = JSON.parse(e.data) } catch {}
    }
    s.onclose = () => { connected.value = false; ws.value = null }
    ws.value = s
  }

  function disconnect() {
    ws.value?.close()
    ws.value = null
    connected.value = false
  }

  return { data, connected, connect, disconnect, groupBy, selectedGroup, setGroupBy, selectGroup }
})