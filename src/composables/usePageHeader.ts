import type { Component } from 'vue';
import { onUnmounted, reactive } from 'vue';

// Types
export interface PageHeaderTab {
    key: string;
    label: string;
}

export interface PageHeaderAction {
    key: string;
    label: string;
    icon?: string | Component;
    severity?: 'primary' | 'secondary' | 'danger' | 'warning' | 'ghost';
    visible: boolean;
    onClick: () => void;
}

export interface PageHeaderBreadcrumb {
    label: string;
    to?: string;
    route?: string; // backwards compatibility
}

export interface PageHeaderState {
    title: string;
    subtitle?: string;
    breadcrumbs: PageHeaderBreadcrumb[];
    tabs: PageHeaderTab[];
    activeTab: string;
    actions: PageHeaderAction[];
}

// Shared reactive state (module-level singleton)
const pageHeaderState = reactive<PageHeaderState>({
    title: '',
    subtitle: undefined,
    breadcrumbs: [],
    tabs: [],
    activeTab: '',
    actions: []
});

function resetPageHeaderState() {
    pageHeaderState.title = '';
    pageHeaderState.subtitle = undefined;
    pageHeaderState.breadcrumbs = [];
    pageHeaderState.tabs = [];
    pageHeaderState.activeTab = '';
    pageHeaderState.actions = [];
}

// usePageHeaderState() — For Layout to read the state
export function usePageHeaderState() {
    return { pageHeaderState };
}

// usePageHeader() — For detail pages to set/update header info
export function usePageHeader() {
    resetPageHeaderState();

    onUnmounted(() => {
        resetPageHeaderState();
    });

    const setTitle = (title: string, subtitle?: string) => {
        pageHeaderState.title = title;
        pageHeaderState.subtitle = subtitle;
    };

    const setBreadcrumbs = (breadcrumbs: PageHeaderBreadcrumb[]) => {
        pageHeaderState.breadcrumbs = breadcrumbs;
    };

    const setTabs = (tabs: PageHeaderTab[], defaultTab?: string) => {
        pageHeaderState.tabs = tabs;
        pageHeaderState.activeTab = defaultTab || tabs[0]?.key || '';
    };

    const setActiveTab = (tabKey: string) => {
        pageHeaderState.activeTab = tabKey;
    };

    const setActions = (actions: PageHeaderAction[]) => {
        pageHeaderState.actions = actions;
    };

    return {
        state: pageHeaderState,
        setTitle,
        setBreadcrumbs,
        setTabs,
        setActiveTab,
        setActions
    };
}
