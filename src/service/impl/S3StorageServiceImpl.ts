import { Environment } from "../../core/Environment.js";
import { StorageError, StorageService } from "../StorageService.js";
import { CopyObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client, S3ServiceException } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const {
    AWS_ID,
    AWS_SECRET,
    S3_REGION,
    S3_BUCKET,
    CDN_BASE_URL,

 } = Environment;


const DEFAULT_SIGNED_URL_EXPIRY = 300; // 5 minute

const MAX_UPLOAD_SIZE = 1024 * 1024 * 1024 // 1 GB


export class S3StorageServiceImpl implements StorageService {

    private readonly client: S3Client;

    constructor() {
        this.client = new S3Client({ 
            region: S3_REGION,
            credentials: {
                accessKeyId: AWS_ID,
                secretAccessKey: AWS_SECRET,
            },
        });
    }

    async getUploadUrl(inputs: StorageService.UploadUrlInputs): Promise<StorageService.UploadUrlOutputs> {
        const { key, contentLength, contentType, expiresInSeconds } = inputs;

        if (contentLength > MAX_UPLOAD_SIZE) {
            throw new StorageError('size-exceed');
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
        if (err instanceof S3ServiceException) {
            if (err.$metadata.httpStatusCode) {
                if (err.$metadata.httpStatusCode >= 500) {
                    new StorageError('client-error', true, err);
                }
                else {
                    new StorageError('client-error', false);
                }
            }
        }

        return new StorageError('unknown-error', true, err);
    }
}