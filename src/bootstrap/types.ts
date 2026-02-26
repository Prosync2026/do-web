export interface BootstrapModule {
    name: string;
    init: () => Promise<void> | void;
}
