import { Injectable, Logger } from '@nestjs/common';
import { join } from 'path';
import { mkdir, unlink, writeFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import {
  ImageStorageInterface,
  ImageUploadOptions,
  ImageUploadResult,
} from './storage.interface';
import { STORAGE_CONFIG } from 'src/constants/storage.constats';

@Injectable()
export class LocalStorageService implements ImageStorageInterface {
  private readonly logger = new Logger(LocalStorageService.name);

  constructor() {
    this.ensureStorageDirExists().catch((err) => {
      this.logger.error(
        `Failed to initialize storage directory: ${err.message}`,
      );
    });
  }

  private async ensureStorageDirExists() {
    if (!existsSync(STORAGE_CONFIG.LOCAL_STORAGE_PATH)) {
      await mkdir(STORAGE_CONFIG.LOCAL_STORAGE_PATH, { recursive: true });
      this.logger.log(
        `Created storage directory at ${STORAGE_CONFIG.LOCAL_STORAGE_PATH}`,
      );
    }
  }

  async upload(
    buffer: Buffer,
    filename: string,
    options?: ImageUploadOptions,
  ): Promise<ImageUploadResult> {
    try {
      const filePath = join(STORAGE_CONFIG.LOCAL_STORAGE_PATH, filename);
      const dirPath = filePath.substring(0, filePath.lastIndexOf('/'));

      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      await writeFile(filePath, buffer);

      const fileStat = await stat(filePath);

      return {
        url: `${STORAGE_CONFIG.SERVER_URL}/static/${filename}`,
        path: filePath,
        size: fileStat.size,
        mimetype: options?.contentType,
      };
    } catch (error) {
      this.logger.error(
        `Upload failed for ${filename}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to store image: ${error.message}`);
    }
  }

  async update(
    oldPath: string,
    newBuffer: Buffer,
    newFilename?: string,
    options?: ImageUploadOptions,
  ): Promise<ImageUploadResult> {
    try {
      const finalFilename = newFilename || oldPath.split('/').pop()!;
      const newPath = newFilename
        ? join(STORAGE_CONFIG.LOCAL_STORAGE_PATH, newFilename)
        : oldPath;

      const dirPath = newPath.substring(0, newPath.lastIndexOf('/'));
      if (!existsSync(dirPath)) {
        await mkdir(dirPath, { recursive: true });
      }

      await writeFile(newPath, newBuffer);

      if (newPath !== oldPath && existsSync(oldPath)) {
        await unlink(oldPath).catch((err) => {
          this.logger.warn(
            `Could not delete old file ${oldPath}: ${err.message}`,
          );
        });
      }

      const fileStat = await stat(newPath);

      return {
        url: `${STORAGE_CONFIG.SERVER_URL}/static/${finalFilename}`,
        path: newPath,
        size: fileStat.size,
        mimetype: options?.contentType,
      };
    } catch (error) {
      this.logger.error(
        `Update failed for ${oldPath}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to update image: ${error.message}`);
    }
  }

  async delete(path: string): Promise<void> {
    try {
      if (existsSync(path)) {
        await unlink(path);
        this.logger.log(`Successfully deleted ${path}`);
      } else {
        this.logger.warn(`File not found for deletion: ${path}`);
      }
    } catch (error) {
      this.logger.error(
        `Delete failed for ${path}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to delete image: ${error.message}`);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getSignedUrl(path: string, expiryTime: number = 3600): Promise<string> {
    try {
      this.logger.warn(
        'Signed URLs are not implemented for local storage - returning public URL',
      );
      const filename = path
        .replace(STORAGE_CONFIG.LOCAL_STORAGE_PATH, '')
        .replace(/^\/+/, '');
      return `${STORAGE_CONFIG.SERVER_URL}/static/${filename}`;
    } catch (error) {
      this.logger.error(`Failed to generate URL for ${path}: ${error.message}`);
      throw new Error(`Failed to generate URL: ${error.message}`);
    }
  }
}
