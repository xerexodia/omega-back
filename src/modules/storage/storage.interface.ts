export abstract class ImageStorageInterface {
  /**
   * Uploads a new image file
   * @param buffer The file buffer to upload
   * @param filename The destination filename/path
   * @param options Additional upload options
   * @returns Promise containing the public URL and storage path
   */
  abstract upload(
    buffer: Buffer,
    filename: string,
    options?: ImageUploadOptions,
  ): Promise<ImageUploadResult>;

  /**
   * Updates an existing image file
   * @param oldPath The current image path to replace
   * @param newBuffer The new file buffer
   * @param newFilename The new filename/path (optional)
   * @param options Additional upload options
   * @returns Promise containing the new public URL and storage path
   */
  abstract update(
    oldPath: string,
    newBuffer: Buffer,
    newFilename?: string,
    options?: ImageUploadOptions,
  ): Promise<ImageUploadResult>;

  /**
   * Deletes an image file
   * @param path The path of the image to delete
   */
  abstract delete(path: string): Promise<void>;

  /**
   * Generates a secure URL for temporary access
   * @param path The image path
   * @param expiryTime URL expiry time in seconds
   */
  abstract getSignedUrl(path: string, expiryTime?: number): Promise<string>;
}

export interface ImageUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
  public?: boolean;
  overwrite?: boolean;
}

export interface ImageUploadResult {
  url: string;
  path: string;
  size: number;
  mimetype?: string;
  etag?: string;
}
