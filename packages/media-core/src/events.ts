export type MediaEventType = "view" | "download";

export interface MediaEvent {
    type: MediaEventType;
    mediaType: "photo" | "video";
    mediaId: number;
    url?: string;
    timestamp: number;
}

export type MediaEventListener = (event: MediaEvent) => void;

export class MediaEventEmitter {
    private readonly listeners = new Set<MediaEventListener>();

    subscribe(listener: MediaEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    emit(event: MediaEvent): void {
        for (const listener of this.listeners) {
            listener(event);
        }
    }
}
