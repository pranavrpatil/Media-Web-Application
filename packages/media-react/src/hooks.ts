import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";
import type {
    MediaEvent,
    MediaEventListener,
    Pagination,
    Photo,
    PhotoSearchParams,
    Video,
    VideoSearchParams,
} from "@media/core";
import { useMediaClient } from "./provider";

export type MediaSearchType = "photo" | "video";
export type MediaSearchItem = Photo | Video;

export interface UseMediaSearchOptions {
    type: MediaSearchType;
    query: string;
    page?: number;
    perPage?: number;
    orientation?: "landscape" | "portrait" | "square";
    size?: "large" | "medium" | "small";
    locale?: string;
    color?: string;
    imageColor?: string;
}

export interface UseMediaSearchResult {
    results: MediaSearchItem[];
    pagination: Pagination | null;
    loading: boolean;
    error: Error | null;
    hasMore: boolean;
    loadMore(): Promise<void>;
    refresh(): Promise<void>;
}

export function useMediaSearch(options: UseMediaSearchOptions): UseMediaSearchResult {
    const client = useMediaClient();
    const [results, setResults] = useState<MediaSearchItem[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    const requestId = useRef(0);

    const loadPage = useCallback(async (page: number, replace: boolean) => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        setError(null);

        try {
            const params = {
                query: options.query,
                page,
                perPage: options.perPage,
                orientation: options.orientation,
                size: options.size,
                locale: options.locale,
                color: options.color,
                imageColor: options.imageColor,
            };
            const response = options.type === "photo"
                ? await client.photos.search(params as PhotoSearchParams)
                : await client.videos.search(params as VideoSearchParams);

            if (currentRequest !== requestId.current) {
                return;
            }

            const items = options.type === "photo"
                ? (response as Awaited<ReturnType<typeof client.photos.search>>).photos
                : (response as Awaited<ReturnType<typeof client.videos.search>>).videos;
            setResults((previous) => replace ? items : [...previous, ...items]);
            setPagination(response);
        } catch (requestError) {
            if (currentRequest === requestId.current) {
                setError(requestError instanceof Error ? requestError : new Error("Media request failed"));
            }
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    }, [client, options.color, options.imageColor, options.locale, options.orientation, options.perPage, options.query, options.size, options.type]);

    useEffect(() => {
        setResults([]);
        setPagination(null);
        void loadPage(options.page ?? 1, true);
    }, [loadPage, options.page]);

    const loadMore = useCallback(async () => {
        if (loading || !pagination || !hasMore(pagination)) {
            return;
        }
        await loadPage(pagination.page + 1, false);
    }, [loadPage, loading, pagination]);

    const refresh = useCallback(async () => {
        await loadPage(options.page ?? 1, true);
    }, [loadPage, options.page]);

    return {
        results,
        pagination,
        loading,
        error,
        hasMore: pagination ? hasMore(pagination) : false,
        loadMore,
        refresh,
    };
}

function hasMore(pagination: Pagination): boolean {
    if (pagination.nextPage) {
        return true;
    }
    if (pagination.totalResults === undefined) {
        return true;
    }
    return pagination.page * pagination.perPage < pagination.totalResults;
}

export interface UseMediaItemOptions {
    type: MediaSearchType;
    id: number;
}

export interface UseMediaItemResult {
    item: MediaSearchItem | null;
    loading: boolean;
    error: Error | null;
    refresh(): Promise<void>;
}

export function useMediaItem({ type, id }: UseMediaItemOptions): UseMediaItemResult {
    const client = useMediaClient();
    const [item, setItem] = useState<MediaSearchItem | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    const requestId = useRef(0);

    const refresh = useCallback(async () => {
        const currentRequest = ++requestId.current;
        setLoading(true);
        setError(null);
        try {
            const result = type === "photo"
                ? await client.photos.getById(id)
                : await client.videos.getById(id);
            if (currentRequest === requestId.current) {
                setItem(result);
            }
        } catch (requestError) {
            if (currentRequest === requestId.current) {
                setError(requestError instanceof Error ? requestError : new Error("Media request failed"));
            }
        } finally {
            if (currentRequest === requestId.current) {
                setLoading(false);
            }
        }
    }, [client, id, type]);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    return { item, loading, error, refresh };
}

export function useMediaEvents(listener?: MediaEventListener): MediaEvent | null {
    const client = useMediaClient();
    const listenerRef = useRef(listener);
    const [lastEvent, setLastEvent] = useState<MediaEvent | null>(null);
    listenerRef.current = listener;

    useEffect(() => {
        const unsubscribe = client.events.subscribe((event) => {
            setLastEvent(event);
            listenerRef.current?.(event);
        });
        return unsubscribe;
    }, [client]);

    return lastEvent;
}
