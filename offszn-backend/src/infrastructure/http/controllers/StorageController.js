
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as getPresignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3Client } from "../../storage/r2Client.js";

const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "offszn-storage";

export const getSignedUrl = async (req, res) => {
    try {
        let { key } = req.body;

        if (!key) {
            return res.status(400).json({ error: "Key is required" });
        }

        // SANITIZATION: If the key comes as a full URL, strip the domain.
        // Example: https://offszn-storage.../beats/file.mp3 -> beats/file.mp3
        if (key.startsWith('http')) {
            const r2Base = '.r2.cloudflarestorage.com/';
            if (key.includes(r2Base)) {
                key = key.split(r2Base)[1];
            } else if (key.includes('/')) {
                // Fallback for other structures (e.g. custom domain), though less likely with R2 default
                // Try to assume everything after the 3rd slash is the path
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

        // Decode URI components in case the URL was encoded (e.g. spaces as %20)
        key = decodeURIComponent(key);

        const command = new GetObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME || "offszn-storage",
            Key: key,
        });

        // Sign for 1 hour (3600 seconds)
        const url = await getPresignedUrl(s3Client, command, { expiresIn: 3600 });

        res.json({ downloadUrl: url });
    } catch (error) {
        console.error("Error signing R2 URL:", error);
        res.status(500).json({ error: "Failed to sign URL" });
    }
};
