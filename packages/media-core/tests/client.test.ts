import { afterEach, describe, expect, it, vi } from "vitest";
import {
    createMediaClient,
    MediaSdkError,
    type FetchLike,
    type PhotoPage,
} from "../src/index";

function response(body: unknown, status = 200) {
    return {
        ok: status >= 200 && status < 300,
        status,
        statusText: status === 200 ? "OK" : "Unauthorized",
        json: async () => body,
    };
}

function createFetch(body: unknown, status = 200): {
    fetch: FetchLike;
    calls: string[];
    headers: Array<Record<string, string> | undefined>;
} {
    const calls: string[] = [];
    const headers: Array<Record<string, string> | undefined> = [];
    const fetch: FetchLike = async (input, init) => {
        calls.push(input);
        headers.push(init?.headers);
        return response(body, status);
    };
    return { fetch, calls, headers };
}

const photoPage: PhotoPage = {
    page: 1,
    perPage: 20,
    totalResults: 1,
    photos: [],
};

afterEach(() => {
    vi.restoreAllMocks();
});

describe("createMediaClient", () => {
    it("initializes with an API key and sends it with requests", async () => {
        const mock = createFetch(photoPage);
        const client = createMediaClient({ apiKey: "test-key", fetch: mock.fetch });

        expect(client.photos).toBeDefined();
        await client.photos.curated();

        expect(mock.calls).toEqual(["https://api.pexels.com/v1/curated"]);
        expect(mock.headers).toEqual([{ Authorization: "test-key" }]);
    });

    it("rejects an empty API key", () => {
        expect(() => createMediaClient({ apiKey: "  ", fetch: createFetch({}).fetch }))
            .toThrowError(MediaSdkError);
    });

    it("searches photos with pagination and query parameters", async () => {
        const mock = createFetch(photoPage);
        const client = createMediaClient({ apiKey: "test-key", fetch: mock.fetch });

        const result = await client.photos.search({ query: "nature", page: 2, perPage: 10 });

        expect(result).toEqual(photoPage);
        expect(mock.calls[0]).toBe("https://api.pexels.com/v1/search?query=nature&page=2&perPage=10");
    });

    it("searches videos", async () => {
        const videoPage = { page: 1, perPage: 15, totalResults: 0, videos: [] };
        const mock = createFetch(videoPage);
        const client = createMediaClient({ apiKey: "test-key", fetch: mock.fetch });

        await expect(client.videos.search({ query: "travel", page: 1, perPage: 15 }))
            .resolves.toEqual(videoPage);
        expect(mock.calls[0]).toBe("https://api.pexels.com/v1/videos/search?query=travel&page=1&perPage=15");
    });

    it("fetches curated photos and preserves pagination data", async () => {
        const curated = {
            ...photoPage,
            nextPage: "https://api.pexels.com/v1/curated?page=2",
        };
        const mock = createFetch(curated);
        const client = createMediaClient({ apiKey: "test-key", fetch: mock.fetch });

        await expect(client.photos.curated({ page: 1, perPage: 20 })).resolves.toEqual(curated);
    });

    it("converts API failures to typed SDK errors", async () => {
        const mock = createFetch({ error: "Invalid API key" }, 401);
        const client = createMediaClient({ apiKey: "bad-key", fetch: mock.fetch });

        await expect(client.photos.curated()).rejects.toMatchObject({
            name: "MediaSdkError",
            code: "HTTP_ERROR",
            status: 401,
        });
    });

    it("caches identical completed requests", async () => {
        const mock = createFetch(photoPage);
        const client = createMediaClient({ apiKey: "test-key", fetch: mock.fetch });

        await client.photos.curated({ page: 1 });
        await client.photos.curated({ page: 1 });

        expect(mock.calls).toHaveLength(1);
    });

    it("deduplicates identical simultaneous requests", async () => {
        let resolveRequest: ((value: ReturnType<typeof response>) => void) | undefined;
        const fetch: FetchLike = async (input) => {
            void input;
            return new Promise((resolve) => {
                resolveRequest = resolve;
            });
        };
        const client = createMediaClient({ apiKey: "test-key", fetch });

        const first = client.photos.curated({ page: 1 });
        const second = client.photos.curated({ page: 1 });
        resolveRequest?.(response(photoPage));

        await expect(Promise.all([first, second])).resolves.toEqual([photoPage, photoPage]);
    });

    it("notifies subscribers and supports unsubscribe", () => {
        const client = createMediaClient({ apiKey: "test-key", fetch: createFetch({}).fetch });
        const listener = vi.fn();
        const unsubscribe = client.subscribe(listener);

        client.trackView("photo", 10, "photo-url");
        unsubscribe();
        client.trackDownload("video", 20, "video-url");

        expect(listener).toHaveBeenCalledTimes(1);
        expect(listener).toHaveBeenCalledWith(expect.objectContaining({
            type: "view",
            mediaType: "photo",
            mediaId: 10,
            url: "photo-url",
        }));
    });

    it("emits view and download events", () => {
        const client = createMediaClient({ apiKey: "test-key", fetch: createFetch({}).fetch });
        const events: string[] = [];
        client.subscribe((event) => events.push(`${event.type}:${event.mediaId}`));

        client.trackView("photo", 1);
        client.trackDownload("photo", 2);

        expect(events).toEqual(["view:1", "download:2"]);
    });

    it("logs events with the default event listener", () => {
        const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
        const client = createMediaClient({ apiKey: "test-key", fetch: createFetch({}).fetch });

        client.trackView("photo", 99);

        expect(log).toHaveBeenCalledWith("media-core event", expect.objectContaining({
            type: "view",
            mediaId: 99,
        }));
    });
});
