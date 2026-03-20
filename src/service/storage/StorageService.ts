import { CopyObjectCommand, DeleteObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"
import { Environment } from "../../core/Environment.js";
import { StorageError } from "./StorageError.js";


const {
    S3_REGION,
    S3_BUCKET,
    CDN_BASE_URL,

 } = Environment;


const DEFAULT_SIGNED_URL_EXPIRY = 1800; // 30 minute

const MAX_UPLOAD_SIZE = 1024 * 1024 * 20 // 20mb

export class StorageService {

    private readonly client: S3Client;

    constructor() {
        this.client = new S3Client({ 
            region: S3_REGION,
            // inside lamda, it provides temporary credentials(accesskey and secretkey).
            // if i explicitly set credentials here, then i will bypass
            // those temporary credentials. so don't set credentials which is not recommended by AWS.
            // if not explicit credentials not set, sdk sets accesskey and secretkey from environment
            // or aws configuration file which ever is available. environment variables are
            // AWS_ACCESS_KEY
            // AWS_SECRET_KEY
            // in dev environment set these values in dev.env so sdk will read these from environment.
            // credentials: {
            //     accessKeyId: AWS_ID,
            //     secretAccessKey: AWS_SECRET,
            // },
        });
    }

    async getUploadUrl(inputs: StorageService.UploadUrlInputs): Promise<StorageService.UploadUrlOutputs> {
        const { key, contentLength, contentType, expiresInSeconds } = inputs;

        if (contentLength > MAX_UPLOAD_SIZE) {
            throw new StorageError("MEDIA_TOO_BIG", { size: contentLength });
        }

        const command = new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            ContentType: contentType,
            ContentLength: contentLength,
        });

        const expiresIn = expiresInSeconds ?? DEFAULT_SIGNED_URL_EXPIRY;

        try {
            const url = await getSignedUrl(this.client, command, { expiresIn });
            return {
                url,
                expiresInSeconds: expiresIn
            }
        }
        catch(err: any) {
            throw this.toStorageError(err);
        }
    }

    async copy(sourceKey: string, destinationKey: string): Promise<void> {
        try {
            await this.client.send(new CopyObjectCommand({
                Bucket: S3_BUCKET,
                Key: destinationKey,
                CopySource: encodeURIComponent(`${S3_BUCKET}/${sourceKey}`),
            }));
        }
        catch(err: any) {
            throw this.toStorageError(err);
        }
    }

    async delete(key: string): Promise<void> {
        try {
            await this.client.send(new DeleteObjectCommand({
                Bucket: S3_BUCKET,
                Key: key,
            }));
        }
        catch(err: any) {
            throw this.toStorageError(err);
        }
    }


    async exists(key: string): Promise<boolean> {
        const command = new HeadObjectCommand({
            Bucket: S3_BUCKET,
            Key: key
        });

        try {
            await this.client.send(command);
            return true;
        }
        catch(err: any) {
            if (err instanceof S3ServiceException) {
                if (err.$metadata.httpStatusCode && err.$metadata.httpStatusCode === 404) {
                    return false;
                }
            }
            throw this.toStorageError(err);
        }
    }

    getPublicUrl(key: string): string {
        return (new URL(key,CDN_BASE_URL)).toString();
    }

    private toStorageError(err: any): StorageError {
        return new StorageError("INTERNAL_ERROR", null, true, err);
    }
}

export namespace StorageService {
    
    export type UploadUrlInputs = {
        key: string;
        contentType: string;
        contentLength: number;
        expiresInSeconds?: number;
    }

    export type UploadUrlOutputs = {
        url: string,
        expiresInSeconds: number,
    }

}