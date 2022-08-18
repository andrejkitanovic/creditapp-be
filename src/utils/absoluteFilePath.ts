import { Request } from 'express';
import path from 'path';

export const absoluteFilePath = (req: Request, filePath: string) => {
	return path.join(req.headers.host ?? '', filePath);
};
