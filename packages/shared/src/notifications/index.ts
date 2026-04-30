import { supabase } from '../supabase';
import type { Notification, User, Profile } from '../types';

export class NotificationService {
  static async createNotification(
    type: Notification['type'],
    recipientId: string,
    actorId: string,
    data: any,
    message: string
  ) {
    try {
      // Create notification in database
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          type,
          recipient_id: recipientId,
          actor_id: actorId,
          data,
          message,
          is_read: false,
        })
        .select()
        .single();

      if (error) throw error;

      // Send push notification if user has a device token
      await this.sendPushNotification(recipientId, {
        title: this.getNotificationTitle(type),
        body: message,
        data: {
          type,
          notificationId: notification.id,
          ...data,
        },
      });

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  static async sendPushNotification(userId: string, payload: any) {
    try {
      // Get user's device tokens
      const { data: tokens, error } = await supabase
        .from('user_devices')
        .select('device_token')
        .eq('user_id', userId);

      if (error || !tokens?.length) return;

      // Send push notification via Expo
      const messages = tokens.map(token => ({
        to: token.device_token,
        sound: 'default',
        ...payload,
      }));

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        throw new Error('Failed to send push notification');
      }
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static getNotificationTitle(type: Notification['type']): string {
    const titles: Record<Notification['type'], string> = {
      like: 'New Like',
      comment: 'New Comment',
      follow: 'New Follower',
      message: 'New Message',
      system: 'System Notification',
      mention: 'You were mentioned',
      chat_message: 'New Message',
      post_shared: 'Post Shared',
      profile_view: 'Profile View',
      video_like: 'Video Liked',
      video_comment: 'Video Comment',
      follow_request: 'Follow Request',
    };
    return titles[type] || 'Notification';
  }

  static async markAsRead(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  static async markAllAsRead(userId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  static async getNotifications(userId: string, limit = 20, offset = 0) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('recipient_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  static async getUnreadCount(userId: string) {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('id')
        .eq('recipient_id', userId)
        .eq('is_read', false);

      if (error) throw error;
      return data?.length || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      throw error;
    }
  }

  static async deleteNotification(notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }

  static subscribeToNotifications(userId: string, callback: (notification: Notification) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}

// Notification creators for different actions
export class NotificationCreators {
  static async likePost(postId: string, postAuthorId: string, likerId: string, likerUsername: string) {
    return NotificationService.createNotification(
      'like',
      postAuthorId,
      likerId,
      { post_id: postId },
      `${likerUsername} liked your post`
    );
  }

  static async commentOnPost(
    postId: string,
    postAuthorId: string,
    commenterId: string,
    commenterUsername: string,
    comment: string
  ) {
    return NotificationService.createNotification(
      'comment',
      postAuthorId,
      commenterId,
      { post_id: postId, comment },
      `${commenterUsername} commented: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`
    );
  }

  static async followUser(followedUserId: string, followerId: string, followerUsername: string) {
    return NotificationService.createNotification(
      'follow',
      followedUserId,
      followerId,
      { follower_id: followerId },
      `${followerUsername} started following you`
    );
  }

  static async mentionUser(
    postId: string,
    mentionedUserId: string,
    mentionerId: string,
    mentionerUsername: string
  ) {
    return NotificationService.createNotification(
      'mention',
      mentionedUserId,
      mentionerId,
      { post_id: postId },
      `${mentionerUsername} mentioned you in a post`
    );
  }

  static async sendMessage(
    chatThreadId: string,
    recipientId: string,
    senderId: string,
    senderUsername: string,
    message: string
  ) {
    return NotificationService.createNotification(
      'chat_message',
      recipientId,
      senderId,
      { chat_thread_id: chatThreadId, message },
      `${senderUsername}: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
    );
  }

  static async sharePost(
    postId: string,
    postAuthorId: string,
    sharerId: string,
    sharerUsername: string
  ) {
    return NotificationService.createNotification(
      'post_shared',
      postAuthorId,
      sharerId,
      { post_id: postId },
      `${sharerUsername} shared your post`
    );
  }

  static async likeVideo(
    videoId: string,
    videoAuthorId: string,
    likerId: string,
    likerUsername: string
  ) {
    return NotificationService.createNotification(
      'video_like',
      videoAuthorId,
      likerId,
      { video_id: videoId },
      `${likerUsername} liked your video`
    );
  }

  static async commentOnVideo(
    videoId: string,
    videoAuthorId: string,
    commenterId: string,
    commenterUsername: string,
    comment: string
  ) {
    return NotificationService.createNotification(
      'video_comment',
      videoAuthorId,
      commenterId,
      { video_id: videoId, comment },
      `${commenterUsername} commented on your video: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`
    );
  }

  static async requestFollow(
    requestedUserId: string,
    requesterId: string,
    requesterUsername: string
  ) {
    return NotificationService.createNotification(
      'follow_request',
      requestedUserId,
      requesterId,
      { requester_id: requesterId },
      `${requesterUsername} requested to follow you`
    );
  }

  static async viewProfile(
    profileOwnerId: string,
    viewerId: string,
    viewerUsername: string
  ) {
    return NotificationService.createNotification(
      'profile_view',
      profileOwnerId,
      viewerId,
      { viewer_id: viewerId },
      `${viewerUsername} viewed your profile`
    );
  }
}
