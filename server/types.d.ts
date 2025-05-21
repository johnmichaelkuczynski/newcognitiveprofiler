declare module 'pdf-parse';

declare namespace Express {
  export interface Multer {
    File: {
      buffer: Buffer;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
    };
  }
}