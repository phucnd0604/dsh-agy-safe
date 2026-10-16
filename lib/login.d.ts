import type { IncomingMessage, ServerResponse } from 'node:http';
export interface AgyStatusInfo {
    installed: boolean;
    version: string;
    agyPath: string;
    scratchDir: string;
    hasCachedAuth: boolean;
    authenticated?: boolean;
}
export declare function detectAgyStatus(agyPath: string, scratchDir: string): Promise<AgyStatusInfo>;
export declare function openLoginTerminal(agyPath: string): {
    started: boolean;
    error?: string;
};
/**
 * 真实跑一次 `agy -p ping` 确认凭据有效（消耗一次模型请求，做成显式动作）。
 *
 * 不用 execFile：它默认给子进程一根从不关闭的 stdin 管道——agy 会话模式在
 * stdin 未 EOF 时会出完 `result` 仍空等（Windows 实测，与 4.7 的 agy models
 * 结论同源），execFile 必须等进程退出才回调，等于把判定绑在进程寿命上；
 * 再叠 20s 固定超时，慢请求一过线就被杀，宿主侧报 `Command failed: agy -p ping
 * ...`（此时 stdout 里的 result 往往已是 SUCCESS），设置页误报「凭据验证未通过」。
 *
 * 改为 spawn + 流式读事件：stdin 置 NUL（verify 不发送任何输入，关 stdin 即优雅
 * 结束会话），逐行解析 stdout，以 `result` 事件本身判定成败，判定后立即结束
 * 进程，不再等待退出；进程未出 result 就退出或触发看门狗时如实报错。
 */
export declare function verifyCredentials(agyPath: string, scratchDir: string): Promise<{
    authenticated: boolean;
    error?: string;
}>;
export declare function sendJson(res: ServerResponse, status: number, data: unknown): void;
export declare function isSameOriginRequest(req: IncomingMessage): boolean;
