# Media UI Component Usage Skill

Use this when building with `@media/ui-react` or `@media/ui-native`. These
packages are deliberately small interaction primitives, not a media product in a
box. The application decides what a tile looks like and where its data comes
from.

## The headless boundary

The components do not fetch, authenticate, know about Pexels, or ship CSS. Give
them a compact item model:

```ts
{ id: string | number; src: string; alt: string; type?: "image" | "video" }
```

The web app in this repository maps Pexels photos and videos into exactly that
shape before rendering them. Keep that mapping in the app. Adding Pexels imports
to `media-ui-react` would make a supposedly reusable component package depend on
the data source it is meant to be independent from.

Render callbacks are the styling contract. Spread the generated props onto the
element that should receive the behavior:

```tsx
<Grid
  items={items}
  renderItem={({ item, getItemProps }) => (
    <button {...getItemProps()} type="button">
      <img src={item.src} alt={item.alt} />
    </button>
  )}
/>
```

Do not spread `getItemProps()` onto a wrapper and then put another button inside
it. That creates nested interactive controls and makes keyboard behavior confusing.

## Grid

Use the same `Grid` for photos and videos. This keeps pagination behavior in one
place and prevents the application from growing a special list implementation
for every media type. Pass `onLoadMore`, `hasMore`, and `loadingMore`; React uses
an IntersectionObserver sentinel, while Native delegates to `FlatList`'s
`onEndReached`.

On web, set `columnCount` when the visual grid has multiple columns. It is used
for ArrowUp and ArrowDown focus movement; it does not create the CSS layout. The
consumer still supplies `display: grid` and the column definitions. Use
`getItemKey` when the source IDs are not unique.

## Lightbox

Keep the Lightbox controlled. Store the selected index in application state and
derive the selected item from the current collection. This matters in the web
example: changing only the index while continuing to pass the original selected
object leaves Previous and Next displaying stale media.

Pass `items`, `index`, `onPrevious`, and `onNext` when navigation is wanted. The
React implementation handles Escape and returns focus to the element that opened
the dialog. Keep close and navigation controls visibly labelled. Images need
useful `alt` text; videos need a playable source, `controls`, and `playsInline`.

Native uses `visible` and a React Native `Modal`. It does not provide web keyboard
behavior, and the default renderer is an image, so provide `renderMedia` for a
native video player.

## ReelSwiper

Use `ReelSwiper` for the video experience rather than inventing a second carousel.
Pass `isActive` to the renderer so the app can play only the visible video, and
send `onActiveItemChange` to application state and view tracking.

The component supplies the active-item detection, but the consumer must make the
viewport feel like a reel. On web that means a constrained height, vertical
overflow, and snap rules on both the viewport and slides:

```css
.reel-viewport {
  height: 80vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
}

.reel-slide {
  min-height: 80vh;
  scroll-snap-align: start;
}
```

Without those dimensions, IntersectionObserver may still report an active item,
but the UI will behave like an ordinary scrolling list instead of a reel.

## Accessibility and practical checks

Give each component a meaningful `ariaLabel` or `accessibilityLabel`, preserve
the generated roles and keyboard handlers, and add classes or styles only to the
markup rendered by the application. The package intentionally has no opinion on
colors, spacing, typography, or media cropping.

Before shipping a screen, try keyboard activation and focus return on the web,
Escape in the Lightbox, load-more at the end of the collection, active-slide
changes while scrolling, and the same flows on a narrow viewport. Those checks
catch the common mistakes here more reliably than a screenshot alone.
