import { DEFAULT_CONFIG, PROVIDER_ID, PROVIDER_NAME, SETTINGS_NS, } from './config.js';
import { AgyAdapter } from './adapter.js';
import { detectAgyStatus, isSameOriginRequest, openLoginTerminal, sendJson, verifyCredentials, } from './login.js';
export const name = 'llm-agy';
export const inject = ['llm', 'webServer', 'settings'];
export function apply(ctx, rawConfig) {
    let resolvedConfig = {
        ...DEFAULT_CONFIG,
        ...(rawConfig ?? {}),
    };
    const adapter = new AgyAdapter(resolvedConfig);
    ctx.effect(() => {
        // 1. Register adapter with LLM service
        const registration = ctx.llm.registerAdapter([PROVIDER_ID], adapter);
        // 2. Register configurable provider for settings UI & Models directory
        const directoryHandle = ctx.llm.registerConfigurableProviders([
            {
                provider: PROVIDER_ID,
                displayName: PROVIDER_NAME,
                settingsNs: SETTINGS_NS,
                settingsPath: [],
            },
        ]);
        // 3. dsh 0.2 removed settings.installSection in favour of settings.configure().
        // This plugin ships its own settings.section page (src/client.ts), so this call
        // tells the host not to auto-generate a second page from Config.
        // ponytail: Config fields are not marked .volatile(), so the host has no form to
        // generate and agyPath etc. are configured in the profile's cordis.patch.yml.
        // Mark the fields .volatile() and read the refs when in-UI editing is needed.
        ctx.inject(['settings'], (settingsCtx) => {
            settingsCtx.settings.configure({ auto: false }, ctx.fiber);
        });
        // 4. Register webServer routes for status probe and login terminal
        let disposeRoutes = () => { };
        ctx.inject(['webServer'], (webServerCtx) => {
            const routePrefix = '/api/dsh-agy';
            const handler = async (req, res) => {
                const url = new URL(req.url ?? '/', 'http://dsh.local');
                if (req.method === 'GET' && url.pathname === `${routePrefix}/status`) {
                    const status = await detectAgyStatus(resolvedConfig.agyPath, resolvedConfig.scratchDir);
                    sendJson(res, 200, { ok: true, value: status });
                    return;
                }
                if (req.method !== 'POST') {
                    sendJson(res, 405, { ok: false, error: { code: 'method-not-allowed', message: 'Method not allowed' } });
                    return;
                }
                if (!isSameOriginRequest(req)) {
                    sendJson(res, 403, { ok: false, error: { code: 'csrf-rejected', message: 'Cross-origin request rejected' } });
                    return;
                }
                switch (url.pathname) {
                    case `${routePrefix}/login`: {
                        const result = openLoginTerminal(resolvedConfig.agyPath);
                        sendJson(res, 200, { ok: true, value: result });
                        return;
                    }
                    case `${routePrefix}/verify`: {
                        const result = await verifyCredentials(resolvedConfig.agyPath, resolvedConfig.scratchDir);
                        sendJson(res, 200, { ok: true, value: result });
                        return;
                    }
                    default: {
                        sendJson(res, 404, { ok: false, error: { code: 'not-found', message: 'Endpoint not found' } });
                        return;
                    }
                }
            };
            const d1 = webServerCtx.webServer.register({
                kind: 'prefix',
                path: routePrefix,
                handler,
            });
            disposeRoutes = () => {
                d1();
            };
        });
        return () => {
            disposeRoutes();
            directoryHandle();
            registration();
            adapter.dispose();
        };
    }, 'dsh-agy-safe: adapter and routes');
}
export { AgyAdapter } from './adapter.js';
export { AgySessionManager, AgySession } from './session.js';
export { TranscriptFlattener } from './flatten.js';
export { ToolCallProtocol } from './tool-protocol.js';
export { ChunkEmitter } from './chunks.js';
export { UsageBaseline } from './usage.js';
export { Config } from './config.js';
