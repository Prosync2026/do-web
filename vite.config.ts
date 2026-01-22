import vue from '@vitejs/plugin-vue';
import Components from 'unplugin-vue-components/vite';
import { defineConfig } from 'vite';

export default defineConfig(async () => {
    const { PrimeVueResolver } = await import('@primevue/auto-import-resolver');

    return {
        plugins: [
            vue(),
            Components({
                resolvers: [PrimeVueResolver()],
                dts: 'components.d.ts'
            })
        ],
        resolve: {
            alias: {
                '@': new URL('./src', import.meta.url).pathname
            }
        }
    };
});
