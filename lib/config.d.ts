import z from '@deepseek-ai/schemastery';
import { type RetryPolicyConfig } from '@deepseek-ai/dsh-llm';
export declare const SETTINGS_NS = "llm-agy";
export declare const PROVIDER_ID = "agy";
export declare const PROVIDER_NAME = "Antigravity CLI";
export declare function getDefaultScratchDir(): string;
export declare const Config: z<Schemastery.ObjectS<NoInfer<{
    agyPath: z<string, string, "defined">;
    defaultEffort: z<"low" | "medium" | "high", "low" | "medium" | "high", "defined">;
    scratchDir: z<string, string, "defined">;
    idleTimeoutMs: z<number, number, "defined">;
    streamIdleTimeoutMs: z<number, number, "defined">;
    turnTimeoutMs: z<number, number, "defined">;
    retryPolicy: z<RetryPolicyConfig>;
}>>, Schemastery.ObjectT<NoInfer<{
    agyPath: z<string, string, "defined">;
    defaultEffort: z<"low" | "medium" | "high", "low" | "medium" | "high", "defined">;
    scratchDir: z<string, string, "defined">;
    idleTimeoutMs: z<number, number, "defined">;
    streamIdleTimeoutMs: z<number, number, "defined">;
    turnTimeoutMs: z<number, number, "defined">;
    retryPolicy: z<RetryPolicyConfig>;
}>>, "plain">;
export type AgyPluginConfig = {
    agyPath?: string;
    defaultEffort?: 'low' | 'medium' | 'high';
    scratchDir?: string;
    idleTimeoutMs?: number;
    streamIdleTimeoutMs?: number;
    turnTimeoutMs?: number;
    retryPolicy?: RetryPolicyConfig;
};
export declare const DEFAULT_CONFIG: Required<AgyPluginConfig>;
