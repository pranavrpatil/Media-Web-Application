import type { Video, VideoPage, VideoSearchParams } from "../types/media";
import { MediaSdkError } from "../errors";
import type { MediaRequester } from "./photos";

export class VideoService {
    constructor(private readonly requester: MediaRequester) { }

    search(params: VideoSearchParams): Promise<VideoPage> {
        if (!params.query.trim()) {
            throw new MediaSdkError(
                "Video search query cannot be empty",
                "INVALID_REQUEST",
            );
        }

        return this.requester.request<VideoPage>("/v1/videos/search", params);
    }

    getById(id: number): Promise<Video> {
        return this.requester.request<Video>(`/v1/videos/${id}`);
    }
}
