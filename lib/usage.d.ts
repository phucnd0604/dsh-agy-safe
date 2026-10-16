import type { TokenUsage } from '@deepseek-ai/dsh-llm';
import type { AgyUsage } from './chunks.js';
/**
 * usage 记账接口：把 agy 的会话累计 usage 折算成本轮增量的 DSH TokenUsage。
 * 实现方必须与累计值的生产者（agy 持续会话进程）同生命周期。
 */
export interface UsageTracker {
    takeUsageDelta(usage: AgyUsage): TokenUsage;
}
/**
 * 会话级 usage 差分基线。
 *
 * agy 持续 stream-json 会话的 result.usage 是进程级累计值（官方字段表明确说明），
 * 因此「上次累计值」必须归属于持有 agy 进程的 AgySession，而不是每次 stream()
 * 新建的 ChunkEmitter——否则复用会话的第二次及后续调用会把当前累计值减 0，
 * 按累计值上报，DSH 的 Turn TPS 分子随之过计量。
 */
export declare class UsageBaseline implements UsageTracker {
    private lastInputTokens;
    private lastOutputTokens;
    private lastThinkingTokens;
    private lastCacheReadTokens;
    takeUsageDelta(usage: AgyUsage): TokenUsage;
}
