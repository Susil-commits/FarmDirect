/**
 * Module augmentation for Express's Request so that fields set by our own
 * middleware (auth, upload) are fully typed everywhere in the codebase.
 */
import type { Request } from 'express';
import type { AuthUser, IUser, UploadedFileMeta, UploadedFileMetaWithField } from './index.js';
import type { Document, Types } from 'mongoose';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthUser;
    /** Full Mongoose user document attached by `protect` to avoid duplicate DB lookups in downstream middleware (B18/B19). */
    userDoc?: IUser & Document;
    uploadedFile?: UploadedFileMeta;
    uploadedFiles?: UploadedFileMetaWithField[];
    uploadError?: string;
  }
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      /** Full Mongoose user document attached by `protect` to avoid duplicate DB lookups in downstream middleware (B18/B19). */
      userDoc?: IUser & Document;
      uploadedFile?: UploadedFileMeta;
      uploadedFiles?: UploadedFileMetaWithField[];
      uploadError?: string;
    }
  }
}

export {};
