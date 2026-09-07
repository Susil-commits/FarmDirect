
import type { Request } from 'express';
import type { AuthUser, IUser, UploadedFileMeta, UploadedFileMetaWithField } from './index.js';
import type { Document, Types } from 'mongoose';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    
    userDoc?: IUser & Document;
    uploadedFile?: UploadedFileMeta;
    uploadedFiles?: UploadedFileMetaWithField[];
    uploadError?: string;
    rawBody?: Buffer;
    requestId?: string;
    log?: import('pino').Logger;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      
      userDoc?: IUser & Document;
      uploadedFile?: UploadedFileMeta;
      uploadedFiles?: UploadedFileMetaWithField[];
      uploadError?: string;
      rawBody?: Buffer;
      requestId?: string;
      log?: import('pino').Logger;
    }
  }
}

export {};
