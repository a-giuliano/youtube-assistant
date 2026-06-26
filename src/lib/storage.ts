import 'server-only';
import { S3Client, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const globalForS3 = globalThis as unknown as { __s3?: S3Client };

const s3 =
  globalForS3.__s3 ??
  new S3Client({
    forcePathStyle:
      (process.env.NEON_STORAGE_FORCE_PATH_STYLE ?? 'true').toLowerCase() !== 'false',
  });

if (process.env.NODE_ENV !== 'production') globalForS3.__s3 = s3;

const BUCKET = 'thumbnails';

export async function signThumbnailUrl(
  key: string,
  expiresIn = 3600,
): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: BUCKET, Key: key }), {
    expiresIn,
  });
}

export async function deleteThumbnail(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
