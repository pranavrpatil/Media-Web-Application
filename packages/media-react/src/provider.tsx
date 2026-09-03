import { createContext, type PropsWithChildren, useContext } from "react";
import type { MediaClient } from "@media/core";

const MediaClientContext = createContext<MediaClient | null>(null);

export interface MediaProviderProps extends PropsWithChildren {
    client: MediaClient;
}

export function MediaProvider({ client, children }: MediaProviderProps) {
    return (
        <MediaClientContext.Provider value={client}>
            {children}
        </MediaClientContext.Provider>
    );
}

export function useMediaClient(): MediaClient {
    const client = useContext(MediaClientContext);
    if (!client) {
        throw new Error("useMediaClient must be used within a MediaProvider");
    }
    return client;
}
