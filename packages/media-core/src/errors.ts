export type MediaErrorCode =
    | "INVALID_CONFIGURATION"
    | "INVALID_REQUEST"
    | "HTTP_ERROR"
    | "NETWORK_ERROR"
    | "INVALID_RESPONSE";

export class MediaSdkError extends Error {
    readonly code: MediaErrorCode;
    readonly status?: number;
    readonly cause?: unknown;

    constructor(
        message: string,
        code: MediaErrorCode,
        options: { status?: number; cause?: unknown } = {},
    ) {
        super(message);
        this.name = "MediaSdkError";
        this.code = code;
        this.status = options.status;
        this.cause = options.cause;
    }
}
