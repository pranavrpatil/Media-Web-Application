import type { Key, ReactNode } from "react";
import type { PressableProps, ViewProps } from "react-native";

export type MediaId = string | number;

export interface MediaItem {
    id: MediaId;
    src: string;
    alt: string;
    type?: "image" | "video" | string;
    thumbnailSrc?: string;
    width?: number;
    height?: number;
    duration?: number;
}

export interface GridItemRenderContext<T extends MediaItem> {
    item: T;
    index: number;
    getItemProps(): PressableProps;
}

export interface GridProps<T extends MediaItem> {
    items: readonly T[];
    renderItem: (context: GridItemRenderContext<T>) => ReactNode;
    getItemKey?: (item: T, index: number) => Key;
    getItemProps?: (item: T, index: number) => PressableProps;
    accessibilityLabel?: string;
    numColumns?: number;
    onItemPress?: (item: T, index: number) => void;
    onItemFocus?: (item: T, index: number) => void;
    onLoadMore?: () => void | Promise<void>;
    hasMore?: boolean;
    loadingMore?: boolean;
}

export interface LightboxRenderContext<T extends MediaItem> {
    item: T;
    index: number;
    getMediaProps(): ViewProps;
}

export interface LightboxProps<T extends MediaItem> {
    visible: boolean;
    item: T | null;
    items?: readonly T[];
    index?: number;
    accessibilityLabel?: string;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    loop?: boolean;
    renderMedia?: (context: LightboxRenderContext<T>) => ReactNode;
    renderCloseButton?: (props: PressableProps) => ReactNode;
    renderPreviousButton?: (props: PressableProps) => ReactNode;
    renderNextButton?: (props: PressableProps) => ReactNode;
}

export interface ReelSlideRenderContext<T extends MediaItem> {
    item: T;
    index: number;
    isActive: boolean;
    getSlideProps(): ViewProps;
}

export interface ReelSwiperProps<T extends MediaItem> {
    items: readonly T[];
    renderSlide: (context: ReelSlideRenderContext<T>) => ReactNode;
    activeIndex?: number;
    defaultActiveIndex?: number;
    onActiveItemChange?: (item: T, index: number) => void;
    getItemKey?: (item: T, index: number) => Key;
    accessibilityLabel?: string;
}
