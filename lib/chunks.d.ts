import type { StreamChunk } from '@deepseek-ai/dsh-llm';
import { ToolCallProtocol } from './tool-protocol.js';
import type { UsageTracker } from './usage.js';
export interface AgyUsage {
    input_tokens?: number;
    output_tokens?: number;
    thinking_tokens?: number;
    cache_read_tokens?: number;
    total_tokens?: number;
}
export interface AgyStepUpdateEvent {
    event: 'step_update';
    step_update: {
        conversation_id?: string;
        step_index?: number;
        state?: 'ACTIVE' | 'DONE';
        step_type: string;
        text_delta?: string;
        usage?: AgyUsage;
        duration_seconds?: number;
    };
}
export interface AgyResultEvent {
    event: 'result';
    result: {
        conversation_id?: string;
        status: 'SUCCESS' | 'ERROR';
        response?: string;
        duration_seconds?: number;
        num_turns?: number;
        usage?: AgyUsage;
        error?: string | {
            code?: string;
            message?: string;
        };
    };
}
export interface AgyInitEvent {
    event: 'init';
    conversation_id?: string;
    init?: {
        cwd?: string;
        tools?: string[];
        permission_mode?: string;
    };
}
export type AgyEvent = AgyInitEvent | AgyStepUpdateEvent | AgyResultEvent | {
    event: string;
    [key: string]: unknown;
};
export declare class ChunkEmitter {
    private readonly toolProtocol;
    private readonly usageTracker;
    /**
     * usage 差分基线由注入的 UsageTracker 持有（生产中是 AgySession，与 agy
     * 进程同生命周期）。emitter 每轮 stream() 新建，绝不能自带跨轮记账状态，
     * 否则复用会话时会把累计 usage 当成本轮增量重复上报。
     */
    constructor(initialBlockIndex: number, usageTracker: UsageTracker);
    getToolProtocol(): ToolCallProtocol;
    handleLine(line: string): StreamChunk[];
    handleTerminalError(error: Error, code?: string): StreamChunk[];
    handleAbort(): StreamChunk[];
}
