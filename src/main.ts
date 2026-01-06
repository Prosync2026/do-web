import '@/assets/styles.scss';
import '@/assets/tailwind.css';
import { definePreset } from '@primevue/themes';
import Aura from '@primevue/themes/aura';
import HighchartsVue from 'highcharts-vue';
import { createPinia } from 'pinia';
import 'primeicons/primeicons.css';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';

import Toast from 'primevue/toast';
import ToastService from 'primevue/toastservice';
import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { setGlobalToast } from '@/utils/showNotification.utils';
import { useToast } from 'primevue/usetoast';

import { vPermission } from '@/directives/permission.directive';

const app = createApp(App);
const pinia = createPinia();

const MyPreset = definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        }
    }
});

app.use(router);
app.use(PrimeVue, {
    ripple: true,
    inputStyle: 'outlined',
    theme: {
        preset: MyPreset,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ToastService);
app.component('Toast', Toast);

app.use(ConfirmationService);
app.use(HighchartsVue);
app.use(pinia);
app.mixin({
    mounted() {
        if (this.$root === this) {
            const toast = useToast();
            setGlobalToast(toast);
        }
    }
});

app.directive('permission', vPermission);

app.mount('#app');
