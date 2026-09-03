import { BackHandler, Image, Modal, Pressable, View } from "react-native";
import { useEffect, useRef } from "react";
import type { LightboxProps, MediaItem } from "./types";

export function Lightbox<T extends MediaItem>({
    visible,
    item,
    items = [],
    index = 0,
    accessibilityLabel = "Media viewer",
    onClose,
    onNext,
    onPrevious,
    loop = false,
    renderMedia = ({ item: mediaItem, getMediaProps }) => (
        <Image
            {...getMediaProps()}
            source={{ uri: mediaItem.src }}
            accessibilityLabel={mediaItem.alt}
        />
    ),
    renderCloseButton = (props) => <Pressable {...props} />,
    renderPreviousButton = (props) => <Pressable {...props} />,
    renderNextButton = (props) => <Pressable {...props} />,
}: LightboxProps<T>) {
    const previousVisible = Boolean(onPrevious) && (loop || index > 0);
    const nextVisible = Boolean(onNext) && (loop || index < items.length - 1);
    const previousFocusRef = useRef<unknown>(null);

    useEffect(() => {
        if (!visible) {
            return;
        }
        const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
            onClose();
            return true;
        });
        return () => subscription.remove();
    }, [onClose, visible]);

    if (!visible || !item) {
        return null;
    }

    const currentIndex = Math.max(0, Math.min(index, Math.max(items.length - 1, 0)));
    const getMediaProps = () => ({
        accessible: true,
        accessibilityLabel: item.alt,
    });

    void previousFocusRef;

    return (
        <Modal
            visible={visible}
            transparent
            onRequestClose={onClose}
        >
            <View accessible accessibilityRole="dialog" accessibilityLabel={accessibilityLabel}>
                {renderCloseButton({
                    accessible: true,
                    accessibilityLabel: "Close media viewer",
                    onPress: onClose,
                })}
                {previousVisible && renderPreviousButton({
                    accessible: true,
                    accessibilityLabel: "Previous media",
                    onPress: onPrevious,
                })}
                {renderMedia({ item, index: currentIndex, getMediaProps })}
                {nextVisible && renderNextButton({
                    accessible: true,
                    accessibilityLabel: "Next media",
                    onPress: onNext,
                })}
            </View>
        </Modal>
    );
}
