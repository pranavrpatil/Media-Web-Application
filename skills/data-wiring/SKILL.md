# Media SDK Data Wiring Skill

Use this when connecting an application to `@media/react`. The important design
decision in this repository is that the app is the composition point: the SDK
knows about Pexels, the UI package knows about generic media, and only the app
knows about both.

## Start with one client

Create the client once and pass it through `MediaProvider`. In the web example,
`apps/web/src/media-client.ts` reads `VITE_PEXELS_API_KEY` and exports either a
client or `null`, which lets the app show a useful setup state instead of throwing
during module evaluation.

Do not create a client inside a component or inside a hook. That defeats the core
cache and request de-duplication, and it makes provider consumers unexpectedly
lose state after a render. The key belongs in `.env`, not in a TypeScript file or
an example committed with a real value. Browser credentials are visible to the
browser by nature, so describe that limitation honestly rather than pretending a
Vite variable is secret.

The app should look roughly like this:

```tsx
const client = createMediaClient({ apiKey: import.meta.env.VITE_PEXELS_API_KEY });

<MediaProvider client={client}>
	<AppContent />
</MediaProvider>
```

Keep `@media/ui-react` as a separate app import. A wrapper importing UI code, or
a UI component importing `@media/core`, would make the dependency boundary much
harder to reuse in a CLI or a React Native application.

## Search and pagination

`useMediaSearch({ type, query, page, perPage, orientation, size })` owns the
request lifecycle. The app still owns what each state looks like:

- While the first page is loading, show loading feedback rather than an empty grid.
- If `error` is set, show the message and a retry action using `refresh`.
- If loading has finished with no results, show an empty state.
- Pass `hasMore`, `loading`, and `loadMore` to the component that renders the list.

The hook appends pages when `loadMore` is called and replaces results when the
query or search options change. Keep the client stable for that behavior to work
with the core cache. One easy mistake is to use `nextPage` as if it were a full
request API; this implementation intentionally requests the next numeric page
through the typed service instead.

Map Pexels objects at the application boundary. For example, the web app chooses
`photo.src.medium` for the tile and `photo.src.small` for the thumbnail, while a
video tile uses `video.image` as its poster and a suitable `video_files[].link` as
its playable source. Do not pass the entire Pexels response shape into the
headless components just because it is convenient.

## Events

Use `useMediaEvents(listener)` for app-level status or analytics. Call
`client.trackView` when a person opens or activates an item, not merely when a
search request returns it. Call `client.trackDownload` when the download action is
actually invoked. The core also has its required default console listener, while
the app subscription remains independent.

## Before calling the wiring finished

Run the build and core tests, then exercise both media modes in the browser. In
particular, check an empty query, a failed request, loading another page, opening
an item, closing it, and downloading a photo. For video details, verify the URL
comes from `video_files[].link`; `Video.image` is only a poster. Also inspect the
imports once: the app may import both wrappers and UI, but the UI packages must
remain unaware of the SDK.
