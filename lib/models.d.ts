import { type LlmModelInfo, type LlmResolvedModelInfo, type ReasoningEffortId } from '@deepseek-ai/dsh-llm';
/** agy models 输出的单行条目：`<id>\t<显示名>`。 */
export interface AgyListedModel {
    id: string;
    name: string;
}
/** 按基础模型归组后的目录条目；efforts 为该模型在 agy 侧实际存在的档位。 */
export interface AgyBaseModel {
    id: string;
    name: string;
    efforts: ReasoningEffortId[];
}
/**
 * 执行 `agy models` 并返回 stdout 原文。
 * 进度 spinner 走 stderr，stdout 只含 `id\t名称` 数据行。
 */
export declare function fetchAgyModelsOutput(agyPath: string): Promise<string>;
/** 严格按 `<id>\t<name>` 解析数据行；其余行（空行等）一律跳过。 */
export declare function parseAgyModelsOutput(output: string): AgyListedModel[];
/**
 * 若条目是档位变体（id 以 `-low/-medium/-high` 结尾，且显示名以对应 ` (Low)` 等结尾），
 * 拆出基础 id、基础显示名与档位；否则原样返回、effort 为 null。
 * 两个条件同时匹配才拆，避免误伤以同名后缀结尾的非档位模型。
 */
export declare function splitEffortVariant(id: string, name: string): {
    baseId: string;
    baseName: string;
    effort: ReasoningEffortId;
} | null;
/** 归组为基础模型：合并同基础下的档位集合，档位按 low→high 排序，保持 agy 的首次出现顺序。 */
export declare function groupBaseModels(listed: readonly AgyListedModel[]): AgyBaseModel[];
/** 档位缺省值：优先 medium，否则取可用档位中最深的一档。 */
export declare function pickDefaultEffort(efforts: readonly ReasoningEffortId[]): ReasoningEffortId;
/**
 * 模型目录：运行时执行 `agy models` 获取真实清单（带 TTL 缓存），
 * 归组为基础模型 + 档位集合。agy 不可用或命令失败时按原样抛错，不伪造清单。
 */
export declare class ModelCatalog {
    private readonly agyPath;
    private readonly cacheTtlMs;
    private bases;
    private fetchedAt;
    private inflight;
    constructor(agyPath: string, cacheTtlMs?: number);
    private ensureFresh;
    /** 仅读缓存；返回该模型的档位集合，未知（缓存未建立）时为 undefined。 */
    peekEfforts(modelId: string): readonly ReasoningEffortId[] | undefined;
    list(provider: string): Promise<readonly LlmModelInfo[]>;
    resolve(provider: string, modelId: string, configuredDefaultEffort: ReasoningEffortId): Promise<LlmResolvedModelInfo>;
}
