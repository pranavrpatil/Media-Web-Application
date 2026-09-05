import { useEffect, useState, type FormEvent } from "react";
import { MediaProvider, useMediaEvents, useMediaSearch, type MediaClient } from "@media/react";
import { Grid, Lightbox, ReelSwiper, type MediaItem } from "@media/ui-react";
import { client } from "./media-client";
import "./App.css";

interface AppMediaItem extends MediaItem {
    photographer?: string;
}

function AppContent({ client }: { client: MediaClient }) {
    const [mode, setMode] = useState<"photo" | "video">("photo");
    const [query, setQuery] = useState("nature");
    const [submittedQuery, setSubmittedQuery] = useState("nature");
    const [selectedPhoto, setSelectedPhoto] = useState<number | null>(null);
    const [reelsDismissed, setReelsDismissed] = useState(false);
    const [activeReel, setActiveReel] = useState(0);
    const [lastEvent, setLastEvent] = useState<string | null>(null);

    useMediaEvents((event) => {
        setLastEvent(`${event.type} ${event.mediaType} #${event.mediaId}`);
    });

    const search = useMediaSearch({
        type: mode,
        query: submittedQuery,
        page: 1,
        perPage: 20,
    });

    const items: AppMediaItem[] = search.results.map((item) => {
        if (!("image" in item)) {
            return {
                id: item.id,
                src: item.src.medium,
                thumbnailSrc: item.src.small,
                alt: item.alt || `Photo by ${item.photographer}`,
                width: item.width,
                height: item.height,
                photographer: item.photographer,
            };
        }

        const playableFile = item.video_files
            .filter((file) => file.file_type === "video/mp4")
            .sort((first, second) => (second.width ?? 0) - (first.width ?? 0))[0];

        return {
            id: item.id,
            src: playableFile?.link ?? item.image,
            thumbnailSrc: item.image,
            alt: `Video by ${item.user.name}`,
            width: item.width,
            height: item.height,
            type: "video",
            duration: item.duration,
            photographer: item.user.name,
        };
    });

    const photos = mode === "photo" ? items : [];
    const videos = mode === "video" ? items : [];
    const selectedItem = selectedPhoto === null ? null : photos[selectedPhoto];

    const showReels = mode === "video" && videos.length > 0 && !reelsDismissed;

    useEffect(() => {
        if (
            mode === "video" &&
            showReels &&
            activeReel >= videos.length - 1 &&
            search.hasMore &&
            !search.loading
        ) {
            void search.loadMore();
        }
    }, [activeReel, mode, search.hasMore, search.loadMore, search.loading, showReels, videos.length]);

    const submitSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const nextQuery = query.trim();
        if (nextQuery) {
            setSubmittedQuery(nextQuery);
        }
    };

    const changeMode = (nextMode: "photo" | "video") => {
        setMode(nextMode);
        setSelectedPhoto(null);
        setReelsDismissed(false);
    };

    return (
        <main className="app-shell">
            <header className="app-header">
                <div>
                    <p className="eyebrow">Pexels media browser</p>
                    <h1>Find something worth keeping.</h1>
                </div>
                <p className="event-status" aria-live="polite">
                    {lastEvent ? `Last event: ${lastEvent}` : "Events ready"}
                </p>
            </header>

            <form className="search-bar" onSubmit={submitSearch}>
                <label htmlFor="media-search">Search media</label>
                <input
                    id="media-search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Try mountains, city nights, ocean..."
                />
                <button type="submit">Search</button>
            </form>

            <nav className="mode-tabs" aria-label="Media type">
                <button type="button" className={mode === "photo" ? "active" : ""} onClick={() => changeMode("photo")}>Photos</button>
                <button type="button" className={mode === "video" ? "active" : ""} onClick={() => changeMode("video")}>Videos</button>
            </nav>

            {search.error && (
                <section className="feedback error" role="alert">
                    <strong>Something went wrong.</strong>
                    <span>{search.error.message}</span>
                    <button type="button" onClick={() => void search.refresh()}>Try again</button>
                </section>
            )}

            {search.loading && search.results.length === 0 && <p className="feedback" aria-live="polite">Loading {mode}...</p>}
            {!search.loading && !search.error && search.results.length === 0 && <p className="feedback">No {mode}s found for &quot;{submittedQuery}&quot;.</p>}

            {mode === "photo" && photos.length > 0 && (
                <section aria-label="Photo results">
                    <div className="section-heading">
                        <div><p className="eyebrow">Search results</p><h2>{photos.length} photos for &quot;{submittedQuery}&quot;</h2></div>
                        {search.loading && <span>Updating...</span>}
                    </div>
                    <Grid
                        items={photos}
                        ariaLabel="Photo search results"
                        columnCount={4}
                        hasMore={search.hasMore}
                        loadingMore={search.loading}
                        onLoadMore={search.loadMore}
                        onItemClick={(item, index) => {
                            setSelectedPhoto(index);
                            client.trackView("photo", Number(item.id), item.src);
                        }}
                        renderItem={({ item, index, getItemProps }) => (
                            <article
                                {...getItemProps()}
                                className="photo-card"
                            >
                                <img src={item.src} alt={item.alt} loading="lazy" />
                                <div className="photo-meta">
                                    <span>{item.photographer}</span>
                                    <button type="button" onClick={(event) => {
                                        event.stopPropagation();
                                        client.trackDownload("photo", Number(item.id), item.src);
                                        window.open(item.src, "_blank", "noopener,noreferrer");
                                    }}>Download</button>
                                </div>
                            </article>
                        )}
                    />
                    {search.loading && search.results.length > 0 && <p className="load-status">Loading more...</p>}
                </section>
            )}

            {mode === "video" && videos.length > 0 && (
                <section aria-label="Video results">
                    <div className="section-heading">
                        <div><p className="eyebrow">Reels</p><h2>{videos.length} videos for &quot;{submittedQuery}&quot;</h2></div>
                        <button type="button" onClick={() => setReelsDismissed(false)}>Open reels</button>
                    </div>
                    <div className="video-list">
                        {videos.map((item, index) => (
                            <button type="button" className="video-card" key={item.id} onClick={() => {
                                setActiveReel(index);
                                setReelsDismissed(false);
                                client.trackView("video", Number(item.id), item.src);
                            }}>
                                <img src={item.thumbnailSrc ?? item.src} alt={item.alt} loading="lazy" />
                                <span>{item.alt}</span>
                            </button>
                        ))}
                    </div>
                    {search.hasMore && <button className="load-more" type="button" onClick={() => void search.loadMore()}>Load more videos</button>}
                </section>
            )}

            <Lightbox
                open={selectedItem !== null}
                item={selectedItem}
                items={photos}
                index={selectedPhoto ?? 0}
                onClose={() => setSelectedPhoto(null)}
                onPrevious={() => setSelectedPhoto((value) => value === null ? null : Math.max(0, value - 1))}
                onNext={() => setSelectedPhoto((value) => value === null ? null : Math.min(photos.length - 1, value + 1))}
                renderMedia={({ item }) => <img src={item.src} alt={item.alt} />}
                renderCloseButton={(props) => <button {...props}>Close</button>}
                renderPreviousButton={(props) => <button {...props}>Previous</button>}
                renderNextButton={(props) => <button {...props}>Next</button>}
            />

            {showReels && videos.length > 0 && (
                <div className="reel-overlay">
                    <button className="reel-close" type="button" onClick={() => setReelsDismissed(true)}>Close reels</button>
                    <ReelSwiper
                        items={videos}
                        activeIndex={activeReel}
                        onActiveItemChange={(item, index) => {
                            setActiveReel(index);
                            client.trackView("video", Number(item.id), item.src);
                        }}
                        ariaLabel="Video reels"
                        renderSlide={({ item, isActive, getSlideProps }) => (
                            <article {...getSlideProps()} className="reel-slide">
                                <video src={item.src} controls playsInline muted autoPlay={isActive} aria-label={item.alt} />
                                <p>{item.alt}</p>
                            </article>
                        )}
                    />
                </div>
            )}
        </main>
    );
}

function App() {
    if (!client) {
        return (
            <main className="app-shell setup-state">
                <p className="eyebrow">Configuration required</p>
                <h1>Add your Pexels API key.</h1>
                <p>Create <code>.env</code> with <code>VITE_PEXELS_API_KEY</code>, then restart the dev server.</p>
            </main>
        );
    }
    return <MediaProvider client={client}><AppContent client={client} /></MediaProvider>;
}

export default App;
