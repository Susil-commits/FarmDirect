/**
 * Module augmentation for Express's Request so that fields set by our own
 * middleware (auth, upload) are fully typed everywhere in the codebase.
 */
import type { Request } from 'express';
import type { AuthUser, UploadedFileMeta, UploadedFileMetaWithField } from './index.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    uploadedFile?: UploadedFileMeta;
    uploadedFiles?: UploadedFileMetaWithField[];
    uploadError?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      uploadedFile?: UploadedFileMeta;
      uploadedFiles?: UploadedFileMetaWithField[];
      uploadError?: string;
    }
  }
}

export {};
