import { ToolCallProtocol } from './tool-protocol.js';
export class ChunkEmitter {
    toolProtocol;
    usageTracker;
    /**
     * usage 差分基线由注入的 UsageTracker 持有（生产中是 AgySession，与 agy
     * 进程同生命周期）。emitter 每轮 stream() 新建，绝不能自带跨轮记账状态，
     * 否则复用会话时会把累计 usage 当成本轮增量重复上报。
     */
    constructor(initialBlockIndex, usageTracker) {
        this.toolProtocol = new ToolCallProtocol(initialBlockIndex);
        this.usageTracker = usageTracker;
    }
    getToolProtocol() {
        return this.toolProtocol;
    }
    handleLine(line) {
        const trimmed = line.trim();
        if (!trimmed)
            return [];
        let parsed;
        try {
            parsed = JSON.parse(trimmed);
        }
        catch {
            // Non-JSON line from process output, skip or ignore
            return [];
        }
        const chunks = [];
        if (parsed.event === 'step_update') {
            const update = parsed.step_update;
            if (update.step_type === 'agent_response' && update.text_delta) {
                chunks.push(...this.toolProtocol.processDelta(update.text_delta));
            }
        }
        else if (parsed.event === 'result') {
            const res = parsed.result;
            // 1. Flush any buffered text or tool call from the protocol
            chunks.push(...this.toolProtocol.flush());
            // 2. Usage：agy 的 result.usage 是会话累计值，差分由会话级 UsageTracker 完成
            if (res.usage) {
                chunks.push({
                    type: 'usage',
                    usage: this.usageTracker.takeUsageDelta(res.usage),
                });
            }
            // 3. Emit finish reason
            let finishReason;
            if (res.status === 'ERROR') {
                const errorMessage = typeof res.error === 'string'
                    ? res.error
                    : res.error?.message || 'Antigravity CLI returned error status';
                finishReason = {
                    kind: 'error',
                    failure: {
                        message: errorMessage,
                        code: typeof res.error === 'object' && res.error?.code ? res.error.code : 'SERVER_ERROR',
                    },
                };
            }
            else if (this.toolProtocol.hasToolCalls()) {
                finishReason = { kind: 'tool-calls' };
            }
            else {
                finishReason = { kind: 'stop' };
            }
            chunks.push({
                type: 'finish',
                reason: finishReason,
            });
        }
        return chunks;
    }
    handleTerminalError(error, code = 'TRANSPORT') {
        const chunks = [...this.toolProtocol.flush()];
        chunks.push({
            type: 'finish',
            reason: {
                kind: 'error',
                failure: {
                    message: error.message,
                    code,
                },
            },
        });
        return chunks;
    }
    handleAbort() {
        const chunks = [...this.toolProtocol.flush()];
        chunks.push({
            type: 'finish',
            reason: {
                kind: 'aborted',
                failure: {
                    message: 'Generation aborted by caller',
                    code: 'ABORTED',
                },
            },
        });
        return chunks;
    }
}
