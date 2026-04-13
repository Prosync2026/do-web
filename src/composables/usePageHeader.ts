import { computed } from 'vue';
import { useRoute } from 'vue-router';

interface BreadcrumbMeta {
    label: string;
    route?: string;
}

interface BreadcrumbItem {
    label: string;
    to?: string;
}

export function usePageHeader() {
    const route = useRoute();

    const breadcrumbs = computed<BreadcrumbItem[]>(() => {
        const meta = (route.meta.breadcrumb ?? []) as BreadcrumbMeta[];
        if (meta.length === 0) return [];

        const items: BreadcrumbItem[] = [];

        // Always prepend Dashboard unless we're on the dashboard itself
        const isDashboard = route.name === 'dashboard';
        if (!isDashboard) {
            items.push({ label: 'Dashboard', to: '/' });
        }

        meta.forEach((item, index) => {
            const isLast = index === meta.length - 1;
            items.push({
                label: item.label,
                ...(isLast ? {} : { to: item.route })
            });
        });

        return items;
    });

    const pageTitle = computed(() => {
        const meta = (route.meta.breadcrumb ?? []) as BreadcrumbMeta[];
        if (meta.length === 0) return '';
        return meta[meta.length - 1].label;
    });

    const pageSubtitle = computed(() => {
        return (route.meta.subtitle as string) ?? '';
    });

    return { breadcrumbs, pageTitle, pageSubtitle };
}
