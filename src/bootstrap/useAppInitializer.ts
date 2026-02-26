import { permissionBootstrap } from './modules/permission.bootstrap';
import { requestOrderBootstrap } from './modules/requestOrder.bootstrap';

const bootstraps = [permissionBootstrap, requestOrderBootstrap];

export function useAppInitializer() {
    async function init() {
        const tasks = bootstraps.map(async (bootstrap) => {
            try {
                await bootstrap.init();
            } catch (error) {
                console.error(`Bootstrap failed: ${bootstrap.name}`, error);
            }
        });

        await Promise.all(tasks);
    }

    return { init };
}
