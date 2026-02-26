import { useRequestOrderStore } from '@/stores/request-order/requestOrder.store';
import type { BootstrapModule } from '../types';

export const requestOrderBootstrap = {
    name: 'request-order',

    async init() {
        const store = useRequestOrderStore();
        await store.refreshPendingCount();
        store.startPolling(); // keep background refresh
    }
};
