import { Router, Request, Response } from 'express';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const router = Router();

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
    api_key: process.env.CLOUDINARY_API_KEY!,
    api_secret: process.env.CLOUDINARY_API_SECRET!,
});

// Multer with Cloudinary storage
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: 'jersey-payments',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [{ quality: 'auto', width: 1200 }],
    } as any,
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

/**
 * POST /api/upload/payment-screenshot
 * Uploads payment screenshot to Cloudinary and returns the URL
 */
router.post('/payment-screenshot', upload.single('file'), (req: Request, res: Response) => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
            return;
        }

        const cloudinaryUrl = (req.file as any).path as string;
        res.json({ url: cloudinaryUrl });
    } catch (error: any) {
        console.error('[Upload] Failed to upload:', error.message);
        res.status(500).json({ error: 'Upload failed' });
    }
});

export default router;
