# Media SDK

The Media SDK is a small TypeScript ecosystem for consuming Pexels media through a
framework-agnostic client, with React and React Native adapters. The API documented
here is the API currently exported by this repository.

## Architecture

```text
Application
	|
	+--> @media/react
	|       |
	|       +--> @media/core
	|
	+--> @media/ui-react

React Native application
	|
	+--> @media/native
			|
			+--> @media/core
```

- `@media/core` contains the Pexels client, typed media contracts, caching, request
  de-duplication, errors, and events. It has no React, React Native, DOM, or JSX
  dependency.
- `@media/react` adapts a core client to React through `MediaProvider` and hooks.
- `@media/native` adapts the same core client to React Native. It does not export
  `createMediaClient`; create the client from `@media/core` and provide it here.
- `@media/ui-react` is an independent headless UI package. It does not know about
  Pexels, the SDK, or `@media/react`; the application maps SDK results to UI props.
- The application owns composition, selection state, download behavior, and the
  mapping from `Photo`/`Video` to its UI model.

## Installation

The packages in this repository are private workspace packages. In a consuming
application, install the published equivalents (or use the workspace package names):

```bash
npm install @media/core
# React applications
npm install @media/react react
# React Native applications
npm install @media/native react react-native
```

`@media/react` and `@media/native` both depend on `@media/core`. React and React
Native are peer dependencies of the adapters.

## Authentication and configuration

Create a client with an API key:

```ts
import { createMediaClient } from "@media/core";

export const mediaClient = createMediaClient({
	apiKey: "YOUR_PEXELS_API_KEY",
});
```

`apiKey` is required and may not be blank. The client sends it as the `Authorization`
header on each Pexels request. Optional configuration is:

| Option | Type | Behavior |
| --- | --- | --- |
| `apiKey` | `string` | Required Pexels API key. |
| `baseUrl` | `string` | Overrides `https://api.pexels.com`; a trailing slash is removed. |
| `fetch` | `FetchLike` | Supplies a fetch implementation when `globalThis.fetch` is unavailable or when testing. |
| `cache` | `MemoryCache` | Supplies the in-memory cache instance used by the client. |

Never commit an API key. A browser application cannot keep a key secret because the
key is sent from the browser. The web example in this repository reads a Vite
variable and only creates the client when it exists:

```ts
import { createMediaClient, type MediaClient } from "@media/react";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY;
export const client: MediaClient | null = apiKey
	? createMediaClient({ apiKey })
	: null;
```

Put the value in a local, ignored `.env` file:

```text
VITE_PEXELS_API_KEY=YOUR_PEXELS_API_KEY
```

For a production browser app, use the credential strategy appropriate for your
deployment. The current SDK sends the configured key directly to Pexels; it does not
provide a server-side proxy or key rotation service.

## `@media/core`

### Photo APIs

```ts
const searchPage = await mediaClient.photos.search({
	query: "mountains",
	page: 1,
	perPage: 20,
	orientation: "landscape",
	size: "large",
	locale: "en-US",
	color: "blue",
	imageColor: "#0000ff",
});

const curatedPage = await mediaClient.photos.curated({
	page: 1,
	perPage: 20,
});

const photo = await mediaClient.photos.getById(123);
```

`photos.search` requires a non-empty `query` and returns `PhotoPage`. `photos.curated`
returns `PhotoPage` and accepts optional pagination. `photos.getById` returns one
`Photo`.

### Video APIs

```ts
const videoPage = await mediaClient.videos.search({
	query: "ocean",
	page: 1,
	perPage: 15,
	orientation: "landscape",
	size: "large",
	locale: "en-US",
});

const video = await mediaClient.videos.getById(456);
```

`videos.search` requires a non-empty `query` and returns `VideoPage`. `videos.getById`
returns one `Video`. A `Video` contains `video_files`, whose `link` is the playable
media URL, and `image`, which is the poster/thumbnail URL. Do not use `image` as a
video source.

There is no video curated/trending method in the current public API.

### Pagination

Photo and video page results have this shape:

```ts
interface Pagination {
	page: number;
	perPage: number;
	totalResults?: number;
	nextPage?: string;
	prevPage?: string;
}
```

The service accepts numeric `page` and `perPage` values. Consumers can request the
next page explicitly:

```ts
let page = await mediaClient.photos.search({ query: "forest", page: 1, perPage: 20 });
const allPhotos = [...page.photos];

while (page.nextPage) {
	page = await mediaClient.photos.search({
		query: "forest",
		page: page.page + 1,
		perPage: page.perPage,
	});
	allPhotos.push(...page.photos);
}
```

The core service does not expose a `loadMore` method. The React hooks provide that
convenience for component state.

### Response types

The public entrypoint exports `Photo`, `PhotoPage`, `PhotoSource`, `Video`,
`VideoPage`, `VideoFile`, `VideoPicture`, `VideoUser`, `Pagination`, and all search
parameter types. `Photo` includes `src` with `original`, `large2x`, `large`,
`medium`, `small`, `portrait`, `landscape`, and `tiny` URLs. `Video` includes its
dimensions, duration, author, poster image, video files, and video pictures.

### Errors

All SDK-generated failures use `MediaSdkError` where possible:

```ts
import { MediaSdkError } from "@media/core";

try {
	await mediaClient.photos.search({ query: "" });
} catch (error) {
	if (error instanceof MediaSdkError) {
		console.error(error.code, error.status, error.message);
	}
}
```

| Code | Meaning | Additional data |
| --- | --- | --- |
| `INVALID_CONFIGURATION` | Blank API key or no runtime fetch implementation. | `cause` may be present for fetch configuration failures. |
| `INVALID_REQUEST` | A photo or video search query is blank. | None. |
| `HTTP_ERROR` | Pexels returned a non-2xx response. | `status` contains the HTTP status. |
| `NETWORK_ERROR` | The fetch operation failed before a response was received. | `cause` contains the original failure. |
| `INVALID_RESPONSE` | The response body was not valid JSON. | `cause` contains the parsing failure. |

React hooks expose failures as `Error | null`; the original `MediaSdkError` instance is
preserved, so its `code`, `status`, and `cause` remain available.

### Caching and request de-duplication

Each client creates (or receives) a `MemoryCache`. Completed responses are cached by
the complete request URL, including its path and encoded query parameters. A later
identical request resolves from that cache without another fetch.

Identical requests made while the first request is pending share the same promise, so
only one network request is made. Failed requests are removed from the pending map and
are not stored as successful cache entries.

```ts
await mediaClient.photos.curated({ page: 1 });
await mediaClient.photos.curated({ page: 1 }); // cached

mediaClient.clearCache();
await mediaClient.photos.curated({ page: 1 }); // fetches again
```

`MemoryCache` provides `get`, `set`, and `clear`. There is no TTL, size limit,
persistence, or automatic invalidation in the current implementation. A custom cache
can be passed only when it is a `MemoryCache` instance (or compatible at runtime).

## Events

The client exposes both `events` and convenience methods:

```ts
const unsubscribe = mediaClient.subscribe((event) => {
	console.log(event.type, event.mediaType, event.mediaId, event.url);
});

mediaClient.trackView("photo", 123, "https://images.example/photo.jpg");
mediaClient.trackDownload("video", 456, "https://videos.example/video.mp4");

unsubscribe();
```

The event payload is:

```ts
interface MediaEvent {
	type: "view" | "download";
	mediaType: "photo" | "video";
	mediaId: number;
	url?: string;
	timestamp: number;
}
```

Events are not generated automatically by media requests. The application decides
when a view or download occurred and calls the corresponding tracking method. A
subscription returns an unsubscribe function, and the emitter removes listeners by
identity. There is no default console logger in the current implementation.

## `@media/react`

### Provider

`MediaProvider` receives an already-created core client:

```tsx
import { createMediaClient } from "@media/core";
import { MediaProvider } from "@media/react";
import { App } from "./App";

const client = createMediaClient({ apiKey: "YOUR_PEXELS_API_KEY" });

export function Root() {
	return (
		<MediaProvider client={client}>
			<App />
		</MediaProvider>
	);
}
```

`useMediaClient` and the other hooks throw if rendered outside a provider.

### `useMediaSearch`

```tsx
import { useMediaSearch } from "@media/react";

export function PhotoResults({ query }: { query: string }) {
	const search = useMediaSearch({
		type: "photo",
		query,
		page: 1,
		perPage: 20,
	});

	if (search.loading && search.results.length === 0) return <p>Loading...</p>;
	if (search.error) return <p role="alert">{search.error.message}</p>;

	return (
		<>
			<ul>
				{search.results.map((photo) => <li key={photo.id}>{photo.alt}</li>)}
			</ul>
			{search.hasMore && (
				<button type="button" onClick={() => void search.loadMore()}>
					Load more
				</button>
			)}
			<button type="button" onClick={() => void search.refresh()}>
				Refresh
			</button>
		</>
	);
}
```

The options are `type`, `query`, optional `page`, `perPage`, `orientation`, `size`,
`locale`, `color`, and `imageColor`. The return value is:

| Property | Type | Behavior |
| --- | --- | --- |
| `results` | `Photo[] | Video[]` | Current results; `loadMore` appends. |
| `pagination` | `Pagination | null` | Latest page metadata. |
| `loading` | `boolean` | True while the current request is active. |
| `error` | `Error | null` | Latest request error. |
| `hasMore` | `boolean` | Derived from `nextPage` or total/page metadata. |
| `loadMore` | `() => Promise<void>` | Requests the next numeric page when available. |
| `refresh` | `() => Promise<void>` | Reloads the initial configured page and replaces results. |

Changing search options starts a new request and replaces the result list. Older
responses are ignored when a newer request has superseded them.

### `useMediaItem`

```tsx
const result = useMediaItem({ type: "video", id: 456 });

if (result.loading) return <p>Loading video...</p>;
if (result.error) return <p>{result.error.message}</p>;
return result.item ? <video src={result.item.video_files[0]?.link} controls /> : null;
```

The options are `{ type: "photo" | "video"; id: number }`. The result is
`{ item, loading, error, refresh }`; `item` starts as `null` and `refresh` replaces it
with the fetched item.

### `useMediaEvents`

```tsx
function EventMonitor() {
	const lastEvent = useMediaEvents((event) => {
		console.log("media event", event);
	});

	return <output>{lastEvent ? `${lastEvent.type}:${lastEvent.mediaId}` : "No events"}</output>;
}
```

The optional listener is called for each event. The hook also returns the latest
`MediaEvent | null`. It subscribes on mount and automatically unsubscribes on cleanup.

## `@media/native`

The native adapter has the same `MediaProvider`, `useMediaClient`, `useMediaSearch`,
`useMediaItem`, and `useMediaEvents` public API and hook behavior as `@media/react`.
It is compiled with React Native as a peer dependency and contains no UI components.

Because `@media/native` does not re-export the client factory, configure the client
from core:

```tsx
import { createMediaClient } from "@media/core";
import {
	MediaProvider,
	useMediaSearch,
} from "@media/native";

const client = createMediaClient({
	apiKey: "YOUR_PEXELS_API_KEY",
});

function SearchScreen() {
	const { results, loading, error, loadMore, hasMore } = useMediaSearch({
		type: "video",
		query: "city",
		perPage: 15,
	});

	if (loading && results.length === 0) return <Text>Loading...</Text>;
	if (error) return <Text>{error.message}</Text>;

	return (
		<>
			<FlatList
				data={results}
				keyExtractor={(item) => String(item.id)}
				renderItem={({ item }) => <Text>{item.id}</Text>}
			/>
			{hasMore && <Button title="Load more" onPress={() => void loadMore()} />}
		</>
	);
}

export function App() {
	return (
		<MediaProvider client={client}>
			<SearchScreen />
		</MediaProvider>
	);
}
```

Import `Text`, `FlatList`, and `Button` from `react-native` in a real application.
The SDK adapter does not provide these components or native styles.

## Complete core example

```ts
import {
	createMediaClient,
	MediaSdkError,
	type MediaEvent,
} from "@media/core";

async function run() {
	const client = createMediaClient({ apiKey: "YOUR_PEXELS_API_KEY" });
	const events: MediaEvent[] = [];
	const unsubscribe = client.events.subscribe((event) => events.push(event));

	try {
		const page = await client.photos.search({ query: "architecture", perPage: 10 });
		const firstPhoto = page.photos[0];
		if (firstPhoto) {
			client.trackView("photo", firstPhoto.id, firstPhoto.src.medium);
		}
		console.log(page.photos, page.nextPage, events);
	} catch (error) {
		if (error instanceof MediaSdkError && error.code === "HTTP_ERROR") {
			console.error(`Pexels returned ${error.status}`);
		}
		throw error;
	} finally {
		unsubscribe();
	}
}

void run();
```

## Troubleshooting

| Symptom | Check |
| --- | --- |
| `INVALID_CONFIGURATION` at startup | Ensure `apiKey` is present and non-blank. In runtimes without `fetch`, pass `fetch` in client options. |
| `useMediaClient must be used within a MediaProvider` | Render the hook below the matching adapter provider. |
| Results never load in a browser app | Confirm the environment variable name is exposed by the bundler (`VITE_PEXELS_API_KEY` in the included Vite app) and restart the dev server after changing `.env`. |
| A video will not play | Use a suitable `video_files[].link`; `Video.image` is only a poster image. |
| Old results appear after a query change | Keep a stable client instance and update the hook `query`; the hook ignores superseded responses and replaces results for a new search. |
| A request appears stale | Call `client.clearCache()` before retrying. The cache has no TTL. |

## Public API reference

### `@media/core`

Exports `createMediaClient`, `MemoryCache`, `MediaSdkError`, `MediaEventEmitter`,
`PhotoService`, `VideoService`, the `MediaClient` and `MediaClientOptions` types,
event types, HTTP adapter types, and all media/pagination types.

### `@media/react`

Exports `createMediaClient`, `MediaProvider`, `useMediaClient`, `useMediaSearch`,
`useMediaItem`, and `useMediaEvents`, plus their public props, option, result, and
media item types.

### `@media/native`

Exports `MediaProvider`, `useMediaClient`, `useMediaSearch`, `useMediaItem`, and
`useMediaEvents`, plus their public props, option, result, and media item types. It
does not export `createMediaClient`; import that function from `@media/core`.

## Scope and limitations

This documentation intentionally describes only APIs present in the current source.
There is no curated video endpoint, automatic event tracking, persistent cache, cache
TTL, server-side authentication layer, or built-in UI in these packages.
