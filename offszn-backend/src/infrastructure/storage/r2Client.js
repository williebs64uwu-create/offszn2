
import { S3Client } from "@aws-sdk/client-s3";

const {
    R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY,
    R2_LEGACY_ENDPOINT, R2_LEGACY_ACCESS_KEY_ID, R2_LEGACY_SECRET_ACCESS_KEY
} = process.env;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    console.warn("⚠️ R2 Primary Credentials missing.");
}

// 1. Primary R2 Client (New)
export const s3Client = new S3Client({
    region: "auto",
    endpoint: R2_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_ACCESS_KEY_ID || "",
        secretAccessKey: R2_SECRET_ACCESS_KEY || "",
    },
});

// 2. Legacy R2 Client (Fallback)
export const legacyS3Client = new S3Client({
    region: "auto",
    endpoint: R2_LEGACY_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: R2_LEGACY_ACCESS_KEY_ID || "",
        secretAccessKey: R2_LEGACY_SECRET_ACCESS_KEY || "",
    },
});
