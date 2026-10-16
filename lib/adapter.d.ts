import { LlmAdapter, type GenerateOptions, type LlmModelInfo, type LlmProviderInfo, type LlmResolvedModelInfo, type ResolvedRetryPolicy, type StreamChunk } from '@deepseek-ai/dsh-llm';
import type { AgyPluginConfig } from './config.js';
export declare class AgyAdapter extends LlmAdapter {
    private readonly config;
    private readonly catalog;
    private readonly sessionManager;
    private readonly retryPolicy;
    constructor(config: Required<AgyPluginConfig>);
    providerInfo(provider: string): LlmProviderInfo;
    providerRetryPolicy(_provider: string): ResolvedRetryPolicy;
    listModels(provider: string): Promise<readonly LlmModelInfo[]>;
    resolveModel(provider: string, model: string, _signal?: AbortSignal): Promise<LlmResolvedModelInfo>;
    stream(options: GenerateOptions): AsyncIterable<StreamChunk>;
    /**
     * 计算出本次生成要传给 agy 的 --effort 值。
     * 目录中无档位变体的模型（如 claude-sonnet-4-6）不能带 --effort，agy 会拒绝；
     * 有档位的模型优先用请求指定档位，未指定时落到配置默认档位。
     */
    private resolveEffort;
    dispose(): void;
}
