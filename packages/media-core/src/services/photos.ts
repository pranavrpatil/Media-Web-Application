import type {
    CuratedPhotosParams,
    Photo,
    PhotoPage,
    PhotoSearchParams,
} from "../types/media";
import { MediaSdkError } from "../errors";

export interface MediaRequester {
    request<T>(path: string, params?: object): Promise<T>;
}

export class PhotoService {
    constructor(private readonly requester: MediaRequester) { }

    search(params: PhotoSearchParams): Promise<PhotoPage> {
        if (!params.query.trim()) {
            throw new MediaSdkError(
                "Photo search query cannot be empty",
                "INVALID_REQUEST",
            );
        }

        return this.requester.request<PhotoPage>("/v1/search", params);
    }

    curated(params: CuratedPhotosParams = {}): Promise<PhotoPage> {
        return this.requester.request<PhotoPage>("/v1/curated", params);
    }

    getById(id: number): Promise<Photo> {
        return this.requester.request<Photo>(`/v1/photos/${id}`);
    }
}
