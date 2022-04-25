import multer from 'multer';
import { Express } from 'express';

export default function (app: Express) {
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, 'uploads');
    },
    filename(req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    },
  });

  app.use(multer({ storage }).single('file'));
};
