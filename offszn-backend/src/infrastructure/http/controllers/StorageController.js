import { GetObjectCommand, PutObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client, legacyS3Client } from "../../storage/r2Client.js";


const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "offsznlatbucket";
const R2_LEGACY_BUCKET_NAME = process.env.R2_LEGACY_BUCKET_NAME || "offszn-storage";

/**
 * Maps frontend folder names to the official Cloudflare R2 structure.
 */
const getMappedPath = (folder) => {
    const mapping = {
        'mp3_tagged': 'beats/mp3/',
        'wav_untagged': 'products/audio/',
        'stems': 'secure-products/beats/',
        'kits': 'secure-products/kits/',
        'presets': 'secure-products/kits/',
        'covers': 'products/covers/' // Added in case it's used later
    };

    return mapping[folder] || '';
};

/**
 * Sanitizes a filename: fixes encoding, removes accents, special characters and replaces spaces.
 */
const sanitizeFilename = (filename) => {
    if (!filename) return `file_${Date.now()}`;

    // 1. Fix Multer UTF-8 encoding (Multer is known for using latin1)
    let decodedName = filename;
    try {
        decodedName = Buffer.from(filename, 'latin1').toString('utf8');
    } catch (e) {
        console.warn("Could not decode filename from latin1, using original:", filename);
    }

    // 2. Remove accents/diacritics
    const normalized = decodedName.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    // 3. Remove special characters (keep dots and hyphens) and replace spaces
    const sanitized = normalized
        .replace(/[^\w\s.-]/g, '')
        .replace(/\s+/g, '_')
        .toLowerCase();

    // 4. Add timestamp to avoid collisions
    const ext = sanitized.includes('.') ? sanitized.split('.').pop() : '';
    const nameWithoutExt = sanitized.includes('.') ? sanitized.substring(0, sanitized.lastIndexOf('.')) : sanitized;

    return `${nameWithoutExt}_${Date.now()}${ext ? '.' + ext : ''}`;
};

export const getSignedUrl = async (req, res) => {
    try {
        let { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: "Key is required" });
        }

        // SANITIZATION: If the key comes as a full URL, strip the domain.
        if (key.startsWith('http')) {
            const r2Base = '.r2.cloudflarestorage.com/';
            if (key.includes(r2Base)) {
                key = key.split(r2Base)[1];
            } else if (key.includes('/')) {
                const parts = key.split('/');
                if (parts.length > 3) {
                    key = parts.slice(3).join('/');
                }
            }
        }

        // Remove leading slash if present
        if (key.startsWith('/')) {
            key = key.substring(1);
        }

        // Decode URI components
        key = decodeURIComponent(key);

        let finalClient = s3Client;
        let finalBucket = R2_BUCKET_NAME;

        // TACTIC: Check if it exists in the PRIMARY bucket first.
        // If it throws a 404, we try the LEGACY bucket.
        try {
            await s3Client.send(new HeadObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key
            }));
            console.log(`[R2] Found in primary: ${key}`);
        } catch (err) {
            if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
                console.log(`[R2] Not found in primary, trying legacy bucket: ${key}`);
                finalClient = legacyS3Client;
                finalBucket = R2_LEGACY_BUCKET_NAME;
            } else {
                // Other error (auth, network), fallback to primary and let it fail in browser if needed
                console.warn(`[R2] Error checking primary bucket (falling back to legacy attempt):`, err.message);
                finalClient = legacyS3Client;
                finalBucket = R2_LEGACY_BUCKET_NAME;
            }
        }

        const command = new GetObjectCommand({
            Bucket: finalBucket,
            Key: key,
        });

        // Sign for 1 hour
        const url = await getPresignedUrl(finalClient, command, { expiresIn: 3600 });

        res.json({ downloadUrl: url });
    } catch (error) {
        console.error("Error signing R2 URL:", error);
        res.status(500).json({ error: "Failed to sign URL" });
    }
};

export const uploadToR2 = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file provided" });
        }

        const { folder } = req.body;
        // userId is not used in the key anymore as per user preference

        const mappedPrefix = getMappedPath(folder);
        const fileName = sanitizeFilename(req.file.originalname);
        const key = `${mappedPrefix}${fileName}`;

        console.log(`[R2 Upload] Creating key: ${key} (Original: ${req.file.originalname})`);

        const command = new PutObjectCommand({
            Bucket: R2_BUCKET_NAME,
            Key: key,
            Body: req.file.buffer,
            ContentType: req.file.mimetype,
        });

        await s3Client.send(command);

        res.json({
            success: true,
            key: key,
            message: "File uploaded to R2 successfully"
        });
    } catch (error) {
        console.error("Error uploading to R2:", error);
        res.status(500).json({ error: "Failed to upload to R2" });
    }
};
