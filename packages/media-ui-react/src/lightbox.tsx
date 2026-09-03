import { useEffect, useRef } from "react";
import type { LightboxProps, MediaItem } from "./types";

export function Lightbox<T extends MediaItem>({
    open,
    item,
    items = [],
    index = 0,
    ariaLabel = "Media viewer",
    onClose,
    onNext,
    onPrevious,
    loop = false,
    closeOnEscape = true,
    closeOnBackdropClick = true,
    renderMedia = ({ item: mediaItem, getMediaProps }) => mediaItem.type === "video"
        ? <video {...getMediaProps()} src={mediaItem.src} controls />
        : <img {...getMediaProps()} src={mediaItem.src} alt={mediaItem.alt} />,
    renderCloseButton = (props) => <button {...props} type="button">Close</button>,
    renderPreviousButton = (props) => <button {...props} type="button">Previous</button>,
    renderNextButton = (props) => <button {...props} type="button">Next</button>,
}: LightboxProps<T>) {
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const currentIndex = Math.max(0, Math.min(index, Math.max(items.length - 1, 0)));
    const canGoPrevious = Boolean(onPrevious) && (loop || currentIndex > 0);
    const canGoNext = Boolean(onNext) && (loop || currentIndex < items.length - 1);

    useEffect(() => {
        if (!open) {
            previousFocusRef.current?.focus();
            return;
        }
        previousFocusRef.current = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        closeButtonRef.current?.focus();
        return () => previousFocusRef.current?.focus();
    }, [open]);

    useEffect(() => {
        if (!open || !closeOnEscape) {
            return;
        }
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            } else if (event.key === "ArrowLeft" && canGoPrevious) {
                event.preventDefault();
                onPrevious?.();
            } else if (event.key === "ArrowRight" && canGoNext) {
                event.preventDefault();
                onNext?.();
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [canGoNext, canGoPrevious, closeOnEscape, onClose, onNext, onPrevious, open]);

    if (!open || !item) {
        return null;
    }

    const getMediaProps = () => ({
        "aria-label": item.alt,
    });

    return (
        <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            onClick={(event) => {
                if (closeOnBackdropClick && event.target === event.currentTarget) {
                    onClose();
                }
            }}
        >
            {renderCloseButton({
                ref: closeButtonRef,
                "aria-label": "Close media viewer",
                onClick: onClose,
            })}
            {canGoPrevious && renderPreviousButton({
                "aria-label": "Previous media",
                onClick: onPrevious,
            })}
            {renderMedia({ item, index: currentIndex, getMediaProps })}
            {canGoNext && renderNextButton({
                "aria-label": "Next media",
                onClick: onNext,
            })}
        </div>
    );
}
