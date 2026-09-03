import { FlatList } from "react-native";
import type { GridProps, MediaItem } from "./types";

export function Grid<T extends MediaItem>({
    items,
    renderItem,
    getItemKey = (item) => item.id,
    getItemProps,
    accessibilityLabel = "Media grid",
    numColumns = 1,
    onItemPress,
    onItemFocus,
    onLoadMore,
    hasMore = false,
    loadingMore = false,
}: GridProps<T>) {
    return (
        <FlatList
            data={items}
            numColumns={numColumns}
            accessibilityLabel={accessibilityLabel}
            accessibilityRole="grid"
            keyExtractor={(item, index) => String(getItemKey(item, index))}
            onEndReached={hasMore && !loadingMore ? onLoadMore : undefined}
            onEndReachedThreshold={0.7}
            renderItem={({ item, index }) => (
                <>
                    {renderItem({
                        item,
                        index,
                        getItemProps: () => {
                            const consumerProps = getItemProps?.(item, index) ?? {};
                            return {
                                ...consumerProps,
                                accessible: true,
                                accessibilityRole: "gridcell",
                                onPress: () => {
                                    consumerProps.onPress?.();
                                    onItemPress?.(item, index);
                                },
                                onFocus: () => {
                                    consumerProps.onFocus?.();
                                    onItemFocus?.(item, index);
                                },
                            };
                        },
                    })}
                </>
            )}
        />
    );
}
