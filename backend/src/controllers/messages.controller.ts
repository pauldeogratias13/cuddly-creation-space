import { FastifyRequest, FastifyReply } from 'fastify';
import * as messagesService from '../services/messages.service.js';
import { success } from '../utils/response.js';

// GET /messages/threads
export async function getThreads(request: FastifyRequest, reply: FastifyReply) {
  const threads = await messagesService.getUserThreads(request.userId);
  return reply.send(success(threads));
}

// POST /messages/threads  body: { userId } for DM or { memberIds, title } for group
export async function createThread(request: FastifyRequest, reply: FastifyReply) {
  const { userId, memberIds, title } = request.body as any;

  let thread;
  if (userId) {
    thread = await messagesService.getOrCreateDMThread(request.userId, userId);
  } else {
    thread = await messagesService.createGroupThread(request.userId, memberIds ?? [], title);
  }

  return reply.status(201).send(success(thread));
}

// GET /messages/threads/:threadId
export async function getThread(
  request: FastifyRequest<{ Params: { threadId: string } }>,
  reply: FastifyReply
) {
  const { threadId } = request.params;
  const thread = await messagesService.getThreadById(threadId, request.userId);
  return reply.send(success(thread));
}

// DELETE /messages/threads/:threadId  (leave)
export async function leaveThread(
  request: FastifyRequest<{ Params: { threadId: string } }>,
  reply: FastifyReply
) {
  const { threadId } = request.params;
  await messagesService.leaveThread(threadId, request.userId);
  return reply.send(success(null, 'Left thread'));
}

// GET /messages/threads/:threadId/messages
export async function getMessages(
  request: FastifyRequest<{ Params: { threadId: string }; Querystring: Record<string, string> }>,
  reply: FastifyReply
) {
  const { threadId } = request.params;
  const page = parseInt(request.query.page ?? '1');
  const limit = parseInt(request.query.limit ?? '50');

  const result = await messagesService.getThreadMessages(threadId, request.userId, page, limit);
  return reply.send(success(result));
}

// POST /messages/threads/:threadId/messages
export async function sendMessage(
  request: FastifyRequest<{ Params: { threadId: string } }>,
  reply: FastifyReply
) {
  const { threadId } = request.params;
  const body = request.body as { text?: string; mediaUrl?: string; replyToId?: string };

  const message = await messagesService.sendMessage(threadId, request.userId, body);
  return reply.status(201).send(success(message, 'Message sent'));
}

// DELETE /messages/:messageId
export async function deleteMessage(
  request: FastifyRequest<{ Params: { messageId: string } }>,
  reply: FastifyReply
) {
  const { messageId } = request.params;
  await messagesService.deleteMessage(messageId, request.userId);
  return reply.send(success(null, 'Message deleted'));
}

// POST /messages/threads/:threadId/read
export async function markAsRead(
  request: FastifyRequest<{ Params: { threadId: string } }>,
  reply: FastifyReply
) {
  const { threadId } = request.params;
  await messagesService.markThreadRead(threadId, request.userId);
  return reply.send(success(null, 'Marked as read'));
}
