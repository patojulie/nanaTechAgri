import { Injectable, Logger } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Point d'entrée unique pour l'hébergement de fichiers (photos, et demain audio/vidéo pour
 * le module Rappels & Communication) sur Cloudinary. Se configure depuis la variable
 * d'environnement `CLOUDINARY_URL` (format `cloudinary://<api_key>:<api_secret>@<cloud_name>`,
 * fourni tel quel par le tableau de bord Cloudinary — voir .env.example).
 */
@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger('CloudinaryService');
  private configured = false;

  private ensureConfigured() {
    if (this.configured) return;
    if (!process.env.CLOUDINARY_URL) {
      this.logger.warn(
        'CLOUDINARY_URL absent : configurez-le dans .env avant d\'envoyer un fichier.',
      );
    }
    cloudinary.config({ secure: true }); // lit CLOUDINARY_URL automatiquement
    this.configured = true;
  }

  /**
   * Envoie un buffer (image, audio, vidéo, document...) et renvoie la réponse Cloudinary
   * (notamment `secure_url`, l'URL à stocker en base). `resource_type: 'auto'` laisse
   * Cloudinary détecter le type de fichier.
   */
  uploadBuffer(
    buffer: Buffer,
    options: { folder: string },
  ): Promise<UploadApiResponse> {
    this.ensureConfigured();
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: options.folder, resource_type: 'auto' },
        (error, result) => {
          if (error || !result) {
            this.logger.error(`Échec de l'envoi vers Cloudinary : ${error?.message}`);
            reject(error ?? new Error("Échec de l'envoi vers Cloudinary"));
            return;
          }
          resolve(result);
        },
      );
      Readable.from(buffer).pipe(uploadStream);
    });
  }
}
