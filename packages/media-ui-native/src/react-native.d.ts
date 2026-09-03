declare module "react-native" {
    import type { ComponentType, ReactNode, RefAttributes } from "react";

    export interface ViewProps {
        accessible?: boolean;
        accessibilityLabel?: string;
        accessibilityRole?: string;
        accessibilityState?: { selected?: boolean; disabled?: boolean };
        children?: ReactNode;
        onFocus?: () => void;
        onStartShouldSetResponder?: () => boolean;
    }

    export interface PressableProps extends ViewProps {
        disabled?: boolean;
        onPress?: () => void;
    }

    export interface ModalProps {
        animationType?: "none" | "slide" | "fade";
        accessibilityLabel?: string;
        onRequestClose?: () => void;
        transparent?: boolean;
        visible?: boolean;
        children?: ReactNode;
    }

    export interface ImageProps extends ViewProps {
        accessibilityLabel?: string;
        source: { uri: string };
    }

    export interface FlatListProps<T> extends ViewProps {
        data: readonly T[];
        keyExtractor?: (item: T, index: number) => string;
        numColumns?: number;
        onEndReached?: () => void;
        onEndReachedThreshold?: number;
        onViewableItemsChanged?: (info: { viewableItems: Array<{ index: number | null }> }) => void;
        pagingEnabled?: boolean;
        renderItem: (info: { item: T; index: number }) => ReactNode;
        showsVerticalScrollIndicator?: boolean;
        viewabilityConfig?: { itemVisiblePercentThreshold?: number };
    }

    export interface FlatList<T> {
        scrollToIndex(options: { index: number; animated?: boolean }): void;
    }

    export const BackHandler: {
        addEventListener(event: "hardwareBackPress", listener: () => boolean): { remove(): void };
    };
    export const FlatList: <T>(props: FlatListProps<T> & RefAttributes<FlatList<T>>) => ReactNode;
    export const Image: ComponentType<ImageProps>;
    export const Modal: ComponentType<ModalProps>;
    export const Pressable: ComponentType<PressableProps>;
    export const View: ComponentType<ViewProps>;
}
