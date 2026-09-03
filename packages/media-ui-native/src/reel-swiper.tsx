import { FlatList } from "react-native";
import { useEffect, useRef, useState } from "react";
import type { MediaItem, ReelSwiperProps } from "./types";
import type { FlatList as FlatListInstance } from "react-native";

export function ReelSwiper<T extends MediaItem>({
    items,
    renderSlide,
    activeIndex: controlledIndex,
    defaultActiveIndex = 0,
    onActiveItemChange,
    getItemKey = (item) => item.id,
    accessibilityLabel = "Media reel",
}: ReelSwiperProps<T>) {
    const [uncontrolledIndex, setUncontrolledIndex] = useState(defaultActiveIndex);
    const activeIndex = controlledIndex ?? uncontrolledIndex;
    const listRef = useRef<FlatListInstance<T> | null>(null);
    const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;

    const handleViewableItemsChanged = ({ viewableItems }: { viewableItems: Array<{ index: number | null }> }) => {
        const nextIndex = viewableItems.find((viewableItem) => viewableItem.index !== null)?.index;
        if (nextIndex === undefined || nextIndex === null || nextIndex === activeIndex || !items[nextIndex]) {
            return;
        }
        setUncontrolledIndex(nextIndex);
        onActiveItemChange?.(items[nextIndex], nextIndex);
    };

    useEffect(() => {
        if (controlledIndex === undefined || !items[controlledIndex]) {
            return;
        }
        listRef.current?.scrollToIndex({ index: controlledIndex, animated: false });
    }, [controlledIndex, items]);

    return (
        <FlatList
            ref={listRef}
            data={items}
            pagingEnabled
            showsVerticalScrollIndicator={false}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="adjustable"
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={handleViewableItemsChanged}
            keyExtractor={(item, index) => String(getItemKey(item, index))}
            renderItem={({ item, index }) => (
                <>
                    {renderSlide({
                        item,
                        index,
                        isActive: index === activeIndex,
                        getSlideProps: () => ({
                            accessible: true,
                            accessibilityRole: "image",
                            accessibilityLabel: `${item.alt}, ${index + 1} of ${items.length}`,
                            accessibilityState: { selected: index === activeIndex },
                        }),
                    })}
                </>
            )}
        />
    );
}
