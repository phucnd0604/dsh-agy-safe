import { createHash } from 'node:crypto';
import { buildToolSystemPrompt, TOOL_CALL_START, TOOL_CALL_END } from './tool-protocol.js';
export function extractBlockText(block) {
    switch (block.type) {
        case 'text':
            return block.text;
        case 'reasoning':
            return ''; // Reasoning is internal, omit from flattened prompt
        case 'tool-call':
            return `${TOOL_CALL_START}\n${JSON.stringify({ name: block.name, arguments: tryParseJson(block.arguments) }, null, 2)}\n${TOOL_CALL_END}`;
        case 'image':
            return `[Image attached: ${block.attachment?.attachmentId ?? 'image'}]`;
        default:
            return '';
    }
}
function tryParseJson(str) {
    try {
        return JSON.parse(str);
    }
    catch {
        return str;
    }
}
export function extractMessageText(message) {
    // Since dsh 0.2 a tool result is its own message role (role: 'tool'), not a content block.
    if (message.role === 'tool') {
        const innerText = message.content.map(extractBlockText).filter(Boolean).join('\n');
        const errFlag = message.isError ? ' (Error)' : '';
        return `[Tool Result for ${message.toolCallId}${errFlag}]:\n${innerText}`;
    }
    return message.content.map(extractBlockText).filter(Boolean).join('\n');
}
export class TranscriptFlattener {
    static computeFingerprint(prevFingerprint, role, content) {
        const hash = createHash('sha256');
        hash.update(prevFingerprint);
        hash.update(':');
        hash.update(role);
        hash.update(':');
        hash.update(content);
        return hash.digest('hex');
    }
    static flattenTurns(messages, baseFingerprint = '') {
        const turns = [];
        let currentHash = baseFingerprint;
        for (const msg of messages) {
            const text = extractMessageText(msg);
            if (!text && msg.role !== 'assistant')
                continue;
            const role = msg.role === 'assistant' ? 'assistant' : 'user';
            currentHash = this.computeFingerprint(currentHash, role, text);
            turns.push({
                role,
                text,
                fingerprint: currentHash,
            });
        }
        return turns;
    }
    static buildFullPrompt(systemPrompt, tools, turns) {
        const sections = [];
        // 1. System section
        const parts = [];
        if (systemPrompt && systemPrompt.trim().length > 0) {
            parts.push(systemPrompt.trim());
        }
        if (tools && tools.length > 0) {
            const toolRules = buildToolSystemPrompt(tools);
            if (toolRules)
                parts.push(toolRules);
        }
        if (parts.length > 0) {
            sections.push(parts.join('\n\n'));
        }
        // 2. Transcript history
        if (turns.length === 0) {
            return sections.join('\n\n');
        }
        // If there is only one user turn and no prior turns, simply format it
        if (turns.length === 1 && turns[0].role === 'user') {
            if (sections.length > 0) {
                return `${sections.join('\n\n')}\n\n${turns[0].text}`;
            }
            return turns[0].text;
        }
        // Multiple turns: format conversational history
        const historyLines = ['# Conversation History'];
        for (let i = 0; i < turns.length - 1; i++) {
            const t = turns[i];
            const speaker = t.role === 'assistant' ? 'Assistant' : 'User';
            historyLines.push(`**${speaker}**:\n${t.text}\n`);
        }
        const lastTurn = turns[turns.length - 1];
        if (lastTurn.role === 'user') {
            historyLines.push(`**User**:\n${lastTurn.text}`);
        }
        else {
            historyLines.push(`**Assistant**:\n${lastTurn.text}`);
        }
        sections.push(historyLines.join('\n'));
        return sections.join('\n\n---\n\n');
    }
    static buildIncrementalPrompt(newTurns) {
        return newTurns.map((t) => t.text).join('\n\n');
    }
}
