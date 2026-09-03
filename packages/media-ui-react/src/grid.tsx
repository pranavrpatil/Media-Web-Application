import { useCallback, useEffect, useRef, useState } from "react";
import type { GridProps, MediaItem } from "./types";

export function Grid<T extends MediaItem>({
    items,
    renderItem,
    getItemKey = (item) => item.id,
    getItemProps,
    ariaLabel = "Media grid",
    columnCount,
    onItemClick,
    onItemFocus,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
    renderLoadMoreTrigger,
}: GridProps<T>) {
    const itemRefs = useRef<Array<HTMLElement | null>>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const loadMoreRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
        if (!onLoadMore || !hasMore || loadingMore || !loadMoreRef.current) {
            return;
        }
        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                void onLoadMore();
            }
        });
        observer.observe(loadMoreRef.current);
        return () => observer.disconnect();
    }, [hasMore, loadingMore, onLoadMore, items.length]);

    const focusItem = useCallback((index: number) => {
        const boundedIndex = Math.max(0, Math.min(index, items.length - 1));
        setActiveIndex(boundedIndex);
        itemRefs.current[boundedIndex]?.focus();
    }, [items.length]);

    const getGeneratedItemProps = (item: T, index: number) => ({
        ...(getItemProps?.(item, index) ?? {}),
        role: "gridcell",
        tabIndex: index === activeIndex ? 0 : -1,
        onClick: (event: React.MouseEvent<HTMLElement>) => {
            getItemProps?.(item, index)?.onClick?.(event);
            onItemClick?.(item, index);
        },
        onFocus: (event: React.FocusEvent<HTMLElement>) => {
            getItemProps?.(item, index)?.onFocus?.(event);
            setActiveIndex(index);
            onItemFocus?.(item, index);
        },
        onKeyDown: (event: React.KeyboardEvent<HTMLElement>) => {
            getItemProps?.(item, index)?.onKeyDown?.(event);
            const columnStep = columnCount ?? 1;
            if (event.key === "ArrowRight") {
                event.preventDefault();
                focusItem(index + 1);
            } else if (event.key === "ArrowLeft") {
                event.preventDefault();
                focusItem(index - 1);
            } else if (event.key === "ArrowDown") {
                event.preventDefault();
                focusItem(index + columnStep);
            } else if (event.key === "ArrowUp") {
                event.preventDefault();
                focusItem(index - columnStep);
            } else if (event.key === "Home") {
                event.preventDefault();
                focusItem(0);
            } else if (event.key === "End") {
                event.preventDefault();
                focusItem(items.length - 1);
            }
        },
    });

    return (
        <>
            <div role="grid" aria-label={ariaLabel}>
                {items.map((item, index) => (
                    <div
                        key={getItemKey(item, index)}
                        ref={(element) => { itemRefs.current[index] = element; }}
                    >
                        {renderItem({ item, index, getItemProps: () => getGeneratedItemProps(item, index) })}
                    </div>
                ))}
            </div>
            {hasMore && (renderLoadMoreTrigger
                ? renderLoadMoreTrigger({ ref: (element) => { loadMoreRef.current = element; }, "aria-busy": loadingMore })
                : <span ref={(element) => { loadMoreRef.current = element; }} aria-busy={loadingMore} />)}
        </>
    );
}
