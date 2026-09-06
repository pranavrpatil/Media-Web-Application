import { MemoryCache } from "./cache";
import { MediaSdkError } from "./errors";
import { MediaEventEmitter, type MediaEventListener } from "./events";
import { PhotoService } from "./services/photos";
import { VideoService } from "./services/videos";
import type { FetchLike, FetchResponse } from "./types/http";

const DEFAULT_BASE_URL = "https://api.pexels.com";

export interface MediaClientOptions {
    apiKey: string;
    baseUrl?: string;
    fetch?: FetchLike;
    cache?: MemoryCache;
}

export interface MediaClient {
    readonly photos: PhotoService;
    readonly videos: VideoService;
    readonly events: MediaEventEmitter;
    clearCache(): void;
    subscribe(listener: MediaEventListener): () => void;
    trackView(mediaType: "photo" | "video", mediaId: number, url?: string): void;
    trackDownload(mediaType: "photo" | "video", mediaId: number, url?: string): void;
}

function getDefaultFetch(): FetchLike {
    const runtime = globalThis as typeof globalThis & { fetch?: FetchLike };
    if (!runtime.fetch) {
        throw new MediaSdkError(
            "No fetch implementation was provided",
            "INVALID_CONFIGURATION",
        );
    }
    return runtime.fetch.bind(globalThis);
}

function createQuery(params: object): string {
    const entries = Object.entries(params).filter(
        (entry): entry is [string, string | number] => entry[1] !== undefined,
    );
    return entries.length === 0
        ? ""
        : `?${entries.map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`).join("&")}`;
}

async function readJson(response: FetchResponse): Promise<unknown> {
    try {
        return await response.json();
    } catch (cause) {
        throw new MediaSdkError(
            "Pexels returned an invalid JSON response",
            "INVALID_RESPONSE",
            { cause },
        );
    }
}

export function createMediaClient(options: MediaClientOptions): MediaClient {
    if (!options.apiKey.trim()) {
        throw new MediaSdkError("An API key is required", "INVALID_CONFIGURATION");
    }

    const fetcher = options.fetch ?? getDefaultFetch();
    const cache = options.cache ?? new MemoryCache();
    const pending = new Map<string, Promise<unknown>>();
    const events = new MediaEventEmitter();
    events.subscribe((event) => {
        console.log("media-core event", event);
    });
    const baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");

    const requester = {
        request<T>(path: string, params: object = {}) {
            const url = `${baseUrl}${path}${createQuery(params)}`;
            const cached = cache.get<T>(url);
            if (cached !== undefined) {
                return Promise.resolve(cached);
            }

            const existing = pending.get(url) as Promise<T> | undefined;
            if (existing) {
                return existing;
            }

            const request = fetcher(url, {
                headers: { Authorization: options.apiKey },
            })
                .catch((cause: unknown) => {
                    throw new MediaSdkError("Unable to reach Pexels", "NETWORK_ERROR", { cause });
                })
                .then(async (response) => {
                    if (!response.ok) {
                        throw new MediaSdkError(
                            `Pexels request failed with ${response.status} ${response.statusText}`,
                            "HTTP_ERROR",
                            { status: response.status },
                        );
                    }
                    const result = await readJson(response) as T;
                    cache.set(url, result);
                    return result;
                })
                .finally(() => pending.delete(url));

            pending.set(url, request);
            return request;
        },
    };

    return {
        photos: new PhotoService(requester),
        videos: new VideoService(requester),
        events,
        clearCache: () => cache.clear(),
        subscribe: (listener) => events.subscribe(listener),
        trackView: (mediaType, mediaId, url) => events.emit({
            type: "view",
            mediaType,
            mediaId,
            url,
            timestamp: Date.now(),
        }),
        trackDownload: (mediaType, mediaId, url) => events.emit({
            type: "download",
            mediaType,
            mediaId,
            url,
            timestamp: Date.now(),
        }),
    };
}
