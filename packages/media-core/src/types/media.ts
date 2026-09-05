export interface Pagination {
    page: number;
    perPage: number;
    totalResults?: number;
    nextPage?: string;
    prevPage?: string;
}

export interface PhotoSource {
    original: string;
    large2x: string;
    large: string;
    medium: string;
    small: string;
    portrait: string;
    landscape: string;
    tiny: string;
}

export interface Photo {
    id: number;
    width: number;
    height: number;
    url: string;
    photographer: string;
    photographerUrl: string;
    photographerId: number;
    avgColor?: string;
    src: PhotoSource;
    liked: boolean;
    alt: string;
}

export interface VideoFile {
    id: number;
    quality: string;
    file_type: string;
    width?: number;
    height?: number;
    fps?: number;
    link: string;
}

export interface VideoPicture {
    id: number;
    picture: string;
    nr: number;
}

export interface VideoUser {
    id: number;
    name: string;
    url: string;
}

export interface Video {
    id: number;
    width: number;
    height: number;
    duration: number;
    fullRes?: string;
    url: string;
    image: string;
    user: VideoUser;
    video_files: VideoFile[];
    video_pictures: VideoPicture[];
}

export interface PhotoPage extends Pagination {
    photos: Photo[];
}

export interface VideoPage extends Pagination {
    videos: Video[];
}

export interface PhotoSearchParams {
    query: string;
    page?: number;
    perPage?: number;
    orientation?: "landscape" | "portrait" | "square";
    size?: "large" | "medium" | "small";
    locale?: string;
    color?: string;
    imageColor?: string;
}

export interface VideoSearchParams {
    query: string;
    page?: number;
    perPage?: number;
    orientation?: "landscape" | "portrait" | "square";
    size?: "large" | "medium" | "small";
    locale?: string;
}

export interface CuratedPhotosParams {
    page?: number;
    perPage?: number;
}
