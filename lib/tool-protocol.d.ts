import type { ContentBlock, StreamChunk, ToolSchema } from '@deepseek-ai/dsh-llm';
export declare const TOOL_CALL_START = "<<<TOOL_CALL>>>";
export declare const TOOL_CALL_END = "<<<END_TOOL_CALL>>>";
export declare function buildToolSystemPrompt(tools: readonly ToolSchema[]): string;
export interface ParsedToolCall {
    name: string;
    arguments: Record<string, unknown> | string;
}
export declare class ToolCallProtocol {
    private readonly initialBlockIndex;
    private readonly maxToolCallBuffer;
    private buffer;
    private inToolCall;
    private currentBlockIndex;
    private isTextBlockOpen;
    private toolCallCount;
    private accumulatedText;
    private toolCallsEmitted;
    constructor(initialBlockIndex?: number, maxToolCallBuffer?: number);
    getEmittedToolCalls(): readonly ContentBlock[];
    hasToolCalls(): boolean;
    processDelta(delta: string): StreamChunk[];
    flush(): StreamChunk[];
    private emitText;
    private closeTextBlock;
    private emitToolCall;
    private tryParseToolCall;
    private findPartialMatch;
}
