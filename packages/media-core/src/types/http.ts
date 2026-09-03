export interface FetchResponse {
    readonly ok: boolean;
    readonly status: number;
    readonly statusText: string;
    json(): Promise<unknown>;
}

export type FetchLike = (
    input: string,
    init?: {
        headers?: Record<string, string>;
    },
) => Promise<FetchResponse>;
