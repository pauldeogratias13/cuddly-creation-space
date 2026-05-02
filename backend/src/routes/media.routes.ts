import { FastifyInstance } from 'fastify';
import { authenticate } from '../middlewares/auth.middleware.js';
import { prisma } from '../config/prisma.js';
import { success } from '../utils/response.js';
import { randomUUID } from 'crypto';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { pipeline } from 'stream/promises';

const UPLOAD_DIR = './uploads';

try {
  mkdirSync(UPLOAD_DIR, { recursive: true });
} catch {}

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'application/pdf': 'pdf',
};

export async function mediaRoutes(app: FastifyInstance) {
  // Upload a file
  app.post('/upload', { preHandler: [authenticate] }, async (request, reply) => {
    const data = await request.file();
    if (!data) {
      return reply.status(400).send({ success: false, error: { message: 'No file uploaded' } });
    }

    const ext = ALLOWED_MIME[data.mimetype];
    if (!ext) {
      return reply.status(415).send({ success: false, error: { message: 'Unsupported file type' } });
    }

    const filename = `${randomUUID()}.${ext}`;
    const filepath = join(UPLOAD_DIR, filename);
    const chunks: Buffer[] = [];

    // Buffer the file to measure size
    for await (const chunk of data.file) {
      chunks.push(chunk as Buffer);
    }
    const buffer = Buffer.concat(chunks);

    await new Promise<void>((resolve, reject) => {
      const ws = createWriteStream(filepath);
      ws.write(buffer, (err) => {
        if (err) reject(err);
        else {
          ws.end(resolve);
        }
      });
    });

    const isImage = data.mimetype.startsWith('image/');
    const isVideo = data.mimetype.startsWith('video/');
    const isAudio = data.mimetype.startsWith('audio/');
    const mediaType = isImage ? 'IMAGE' : isVideo ? 'VIDEO' : isAudio ? 'AUDIO' : ('DOCUMENT' as const);

    const media = await prisma.media.create({
      data: {
        userId: request.userId,
        type: mediaType,
        url: `/uploads/${filename}`,
        mimeType: data.mimetype,
        size: buffer.length,
      },
    });

    return reply.status(201).send(
      success(
        { id: media.id, url: media.url, type: media.type, mimeType: media.mimeType, size: media.size },
        'File uploaded'
      )
    );
  });

  // Get media metadata by id
  app.get('/:mediaId', { preHandler: [authenticate] }, async (request: any, reply) => {
    const { mediaId } = request.params;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return reply.status(404).send({ success: false, error: { message: 'Media not found' } });
    return reply.send(success(media));
  });

  // Delete media
  app.delete('/:mediaId', { preHandler: [authenticate] }, async (request: any, reply) => {
    const { mediaId } = request.params;
    const media = await prisma.media.findUnique({ where: { id: mediaId } });
    if (!media) return reply.status(404).send({ success: false, error: { message: 'Media not found' } });
    if (media.userId !== request.userId) {
      return reply.status(403).send({ success: false, error: { message: 'Forbidden' } });
    }
    await prisma.media.delete({ where: { id: mediaId } });
    return reply.send(success(null, 'Media deleted'));
  });
}
