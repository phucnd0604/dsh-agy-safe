import type { ContentBlock, RequestMessage, ToolSchema } from '@deepseek-ai/dsh-llm';
export interface FlattenedTurn {
    role: 'user' | 'assistant';
    text: string;
    fingerprint: string;
}
export declare function extractBlockText(block: ContentBlock): string;
export declare function extractMessageText(message: RequestMessage): string;
export declare class TranscriptFlattener {
    static computeFingerprint(prevFingerprint: string, role: string, content: string): string;
    static flattenTurns(messages: readonly RequestMessage[], baseFingerprint?: string): FlattenedTurn[];
    static buildFullPrompt(systemPrompt: string | undefined, tools: readonly ToolSchema[] | undefined, turns: readonly FlattenedTurn[]): string;
    static buildIncrementalPrompt(newTurns: readonly FlattenedTurn[]): string;
}
