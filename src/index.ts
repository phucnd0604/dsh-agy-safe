import type { Context } from '@deepseek-ai/cordis';
import {
  DEFAULT_CONFIG,
  PROVIDER_ID,
  PROVIDER_NAME,
  SETTINGS_NS,
  type AgyPluginConfig,
} from './config.js';
import { AgyAdapter } from './adapter.js';
import {
  detectAgyStatus,
  isSameOriginRequest,
  openLoginTerminal,
  sendJson,
  verifyCredentials,
} from './login.js';

export const name = 'llm-agy';
export const inject = ['llm', 'webServer', 'settings'];

export function apply(ctx: Context, rawConfig?: AgyPluginConfig): void {
  let resolvedConfig: Required<AgyPluginConfig> = {
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

    // 3. dsh 0.2 移除了 settings.installSection，改为 settings.configure()。
    // 本插件自带 settings.section 页面（src/client.ts），所以这里是声明「宿主
    // 不要再按 Config 自动生成一页」，而不是注册表单。
    // ponytail: Config 未标 .volatile()，宿主无表单可生成，agyPath 等改配置走
    // profile 的 cordis.patch.yml；要 UI 可编辑时再给字段加 .volatile() 并读 ref。
    ctx.inject(['settings'], (settingsCtx: any) => {
      settingsCtx.settings.configure({ auto: false }, ctx.fiber);
    });

    // 4. Register webServer routes for status probe and login terminal
    let disposeRoutes = () => {};
    ctx.inject(['webServer'], (webServerCtx: any) => {
      const routePrefix = '/api/dsh-agy';

      const handler = async (req: any, res: any) => {
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
