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
        },
        server: {
            proxy: {
                // Proxy AI scan API calls to bypass browser CORS restrictions.
                // In production, route through own backend instead.
                '/ai-api': {
                    target: 'https://ai-api-dev.qubit-it.com.my',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/ai-api/, '/api'),
                    secure: true
                }
            }
        }
    };
});
