import { createMediaClient, type MediaClient } from "@media/react";

const apiKey = import.meta.env.VITE_PEXELS_API_KEY;

export const client: MediaClient | null = apiKey
	? createMediaClient({ apiKey })
	: null;
