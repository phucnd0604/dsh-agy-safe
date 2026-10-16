export interface ClientContext {
    slots: {
        inject(name: string, callback: () => void): void;
        register(options: {
            name: string;
            id: string;
            order?: number;
            label?: () => string;
        }, component: any): void;
    };
}
export declare const inject: string[];
export declare function apply(ctx: ClientContext): void;
