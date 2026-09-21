import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
const GROUP_KEY = 'fault-group-by';
const VALID_GROUPS = ['type', 'area', 'shift'];
function loadGroupBy() {
    const v = localStorage.getItem(GROUP_KEY);
    return v && VALID_GROUPS.includes(v) ? v : 'type';
}
export const useFactoryStore = defineStore('factory', () => {
    const data = ref(null);
    const ws = ref(null);
    const connected = ref(false);
    // 故障分布图的当前分组维度（刷新后保留）与选中的组
    const faultGroupBy = ref(loadGroupBy());
    const selectedFaultGroup = ref(null);
    watch(faultGroupBy, (v) => localStorage.setItem(GROUP_KEY, v));
    function connect() {
        if (ws.value)
            return;
        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        const s = new WebSocket(`${protocol}//${location.hostname}:8000/ws`);
        s.onopen = () => { connected.value = true; console.log('WS connected'); };
        s.onmessage = (e) => {
            try {
                data.value = JSON.parse(e.data);
            }
            catch { }
        };
        s.onclose = () => { connected.value = false; ws.value = null; };
        ws.value = s;
    }
    function disconnect() {
        ws.value?.close();
        ws.value = null;
        connected.value = false;
    }
    return { data, connected, faultGroupBy, selectedFaultGroup, connect, disconnect };
});
