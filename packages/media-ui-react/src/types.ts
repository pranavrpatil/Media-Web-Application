import type {
    ButtonHTMLAttributes,
    HTMLAttributes,
    Key,
    ReactNode,
    RefCallback,
    RefAttributes,
} from "react";

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
    getItemProps(): HTMLAttributes<HTMLElement>;
}

export interface GridProps<T extends MediaItem> {
    items: readonly T[];
    renderItem: (context: GridItemRenderContext<T>) => ReactNode;
    getItemKey?: (item: T, index: number) => Key;
    getItemProps?: (item: T, index: number) => HTMLAttributes<HTMLElement>;
    ariaLabel?: string;
    columnCount?: number;
    onItemClick?: (item: T, index: number) => void;
    onItemFocus?: (item: T, index: number) => void;
    onLoadMore?: () => void | Promise<void>;
    hasMore?: boolean;
    loadingMore?: boolean;
    renderLoadMoreTrigger?: (props: {
        ref: RefCallback<HTMLElement>;
        "aria-busy": boolean;
    }) => ReactNode;
}

export interface LightboxRenderContext<T extends MediaItem> {
    item: T;
    index: number;
    getMediaProps(): HTMLAttributes<HTMLElement>;
}

export interface LightboxProps<T extends MediaItem> {
    open: boolean;
    item: T | null;
    items?: readonly T[];
    index?: number;
    ariaLabel?: string;
    onClose: () => void;
    onNext?: () => void;
    onPrevious?: () => void;
    loop?: boolean;
    closeOnEscape?: boolean;
    closeOnBackdropClick?: boolean;
    renderMedia?: (context: LightboxRenderContext<T>) => ReactNode;
    renderCloseButton?: (props: ButtonHTMLAttributes<HTMLButtonElement> & RefAttributes<HTMLButtonElement>) => ReactNode;
    renderPreviousButton?: (props: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
    renderNextButton?: (props: ButtonHTMLAttributes<HTMLButtonElement>) => ReactNode;
}

export interface ReelSlideRenderContext<T extends MediaItem> {
    item: T;
    index: number;
    isActive: boolean;
    getSlideProps(): HTMLAttributes<HTMLElement>;
}

export interface ReelSwiperProps<T extends MediaItem> {
    items: readonly T[];
    renderSlide: (context: ReelSlideRenderContext<T>) => ReactNode;
    activeIndex?: number;
    defaultActiveIndex?: number;
    onActiveItemChange?: (item: T, index: number) => void;
    getItemKey?: (item: T, index: number) => Key;
    ariaLabel?: string;
    loop?: boolean;
    keyboardNavigation?: boolean;
}
