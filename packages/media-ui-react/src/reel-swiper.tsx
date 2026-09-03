import { useEffect, useRef, useState } from "react";
import type { MediaItem, ReelSwiperProps } from "./types";

export function ReelSwiper<T extends MediaItem>({
    items,
    renderSlide,
    activeIndex: controlledIndex,
    defaultActiveIndex = 0,
    onActiveItemChange,
    getItemKey = (item) => item.id,
    ariaLabel = "Media reel",
    loop = false,
    keyboardNavigation = true,
}: ReelSwiperProps<T>) {
    const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultActiveIndex);
    const activeIndex = controlledIndex ?? uncontrolledIndex;
    const slideRefs = useRef<Array<HTMLElement | null>>([]);

    const setActiveIndex = (nextIndex: number) => {
        if (items.length === 0) {
            return;
        }
        const normalizedIndex = loop
            ? (nextIndex + items.length) % items.length
            : Math.max(0, Math.min(nextIndex, items.length - 1));
        setUncontrolledIndex(normalizedIndex);
        onActiveItemChange?.(items[normalizedIndex], normalizedIndex);
        slideRefs.current[normalizedIndex]?.scrollIntoView({ block: "nearest" });
    };

    useEffect(() => {
        if (!keyboardNavigation) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                event.preventDefault();
                setActiveIndex(activeIndex + 1);
            } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                setActiveIndex(activeIndex - 1);
            } else if (event.key === "Home") {
                event.preventDefault();
                setActiveIndex(0);
            } else if (event.key === "End") {
                event.preventDefault();
                setActiveIndex(items.length - 1);
            }
        };
        const viewport = slideRefs.current[0]?.parentElement;
        viewport?.addEventListener("keydown", handleKeyDown);
        return () => viewport?.removeEventListener("keydown", handleKeyDown);
    }, [activeIndex, items.length, keyboardNavigation, loop]);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            const visible = entries
                .filter((entry) => entry.isIntersecting)
                .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];
            const nextIndex = visible ? slideRefs.current.indexOf(visible.target as HTMLElement) : -1;
            if (nextIndex >= 0 && nextIndex !== activeIndex) {
                setUncontrolledIndex(nextIndex);
                onActiveItemChange?.(items[nextIndex], nextIndex);
            }
        }, { threshold: 0.6 });
        slideRefs.current.forEach((slide) => {
            if (slide) observer.observe(slide);
        });
        return () => observer.disconnect();
    }, [activeIndex, items, onActiveItemChange]);

    return (
        <div
            role="region"
            aria-label={ariaLabel}
            aria-roledescription="carousel"
            tabIndex={0}
        >
            {items.map((item, index) => (
                <div
                    key={getItemKey(item, index)}
                    ref={(element) => { slideRefs.current[index] = element; }}
                    role="group"
                    aria-roledescription="slide"
                    aria-label={`${index + 1} of ${items.length}`}
                    aria-current={index === activeIndex ? "true" : undefined}
                >
                    {renderSlide({
                        item,
                        index,
                        isActive: index === activeIndex,
                        getSlideProps: () => ({
                            tabIndex: index === activeIndex ? 0 : -1,
                        }),
                    })}
                </div>
            ))}
        </div>
    );
}
