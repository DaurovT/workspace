import { Router, type Request, type Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { S3Client } from '@aws-sdk/client-s3';
import multerS3 from 'multer-s3';

const router = Router();

let storage: multer.StorageEngine;

if (process.env.S3_ENDPOINT) {
  const s3 = new S3Client({
    region: 'us-east-1',
    endpoint: process.env.S3_ENDPOINT,
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY || '',
      secretAccessKey: process.env.S3_SECRET_KEY || ''
    },
    forcePathStyle: true,
  });

  storage = multerS3({
    s3: s3,
    bucket: process.env.S3_BUCKET || 'workspace',
    metadata: function (req: any, file: any, cb: any) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req: any, file: any, cb: any) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
} else {
  const uploadDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
}

const upload = multer({ storage });

router.post('/', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    let fileUrl = '';
    if ((req.file as any).location) {
      // S3 upload
      fileUrl = (req.file as any).location;
    } else {
      // Local upload
      fileUrl = `/uploads/${req.file.filename}`;
    }
    
    res.json({ url: fileUrl, name: req.file.originalname });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

export default router;
