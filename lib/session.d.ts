import { type GenerateOptions, type TokenUsage } from '@deepseek-ai/dsh-llm';
import { type UsageTracker } from './usage.js';
import type { AgyUsage } from './chunks.js';
export interface SessionConfig {
    agyPath: string;
    scratchDir: string;
    idleTimeoutMs: number;
    streamIdleTimeoutMs: number;
    turnTimeoutMs: number;
}
/**
 * 模型后端 agy 进程的完整参数表。抽成纯函数以便单测断言
 * `--print-timeout` 一定在场——agy 缺省 5m 会误杀长轮次。
 */
export declare function buildAgyArgs(model: string, effort: string, turnTimeoutMs: number): string[];
/**
 * 会话池键：dsh 的标题/压缩辅助调用（purpose='session-title'/'compaction'）
 * 与主对话共享同一个 sessionId，但历史完全不同且可能并发；按 purpose 隔离
 * 成独立 agy 进程，避免辅助调用的指纹不匹配把正在流式的主进程杀掉。
 */
export declare function sessionKeyFor(sessionId: string, purpose?: string): string;
export declare function buildAgyEnv(base?: NodeJS.ProcessEnv): NodeJS.ProcessEnv;
export declare class AgySession implements UsageTracker {
    private readonly config;
    readonly sessionId: string;
    readonly model: string;
    readonly effort: string;
    private child;
    private historyFingerprints;
    private lastActivity;
    private idleTimer;
    private usageBaseline;
    constructor(sessionId: string, model: string, effort: string, config: SessionConfig);
    isAlive(): boolean;
    /**
     * 会话级 usage 差分：agy 持续会话的 result.usage 是本进程的累计值，
     * 基线与进程同生命周期，跨 stream() 调用持久。
     */
    takeUsageDelta(usage: AgyUsage): TokenUsage;
    getHistoryFingerprints(): readonly string[];
    setHistoryFingerprints(fps: string[]): void;
    /**
     * 进程空闲计时器：只统计「进程没有产出任何事件」的时间。
     * 每一行输出都调用 touch() 重置，所以一个持续产出的长轮次不会被误杀；
     * 轮次中途真正卡死（静默）由 streamTurn 里的 streamIdleTimeoutMs 看门狗负责。
     * 轮次边界（streamTurn 进入/退出）也各 touch 一次，用于回收停轮后闲置的进程。
     */
    touch(): void;
    private resetIdleTimer;
    private spawnProcess;
    streamTurn(prompt: string, signal?: AbortSignal): AsyncIterable<string>;
    dispose(): void;
}
export declare class AgySessionManager {
    private readonly config;
    private readonly sessions;
    constructor(config: SessionConfig);
    resolvePromptAndSession(options: GenerateOptions, effort: string): {
        session: AgySession;
        prompt: string;
    };
    dispose(): void;
}
