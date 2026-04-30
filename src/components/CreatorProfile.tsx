/**
 * CreatorProfile.tsx
 * 
 * Displays a content creator's profile with:
 * - Profile header (avatar, name, bio, stats)
 * - Follow/Unfollow button
 * - List of their posted videos
 * - Followers/Following lists
 */

import { useState, useEffect } from "react";
import { useContentCreator, CreatorProfile as CreatorProfileType, CreatorPost } from "@/hooks/use-content-creator";
import { useAuth } from "@/hooks/use-auth";
import { useVideoSocial } from "@/hooks/use-video-social";
import { Heart, MessageCircle, Share2, User, Users, Video, Check, Plus } from "lucide-react";
import { toast } from "sonner";

interface CreatorProfileProps {
  userId: string;
}

export function CreatorProfile({ userId }: CreatorProfileProps) {
  const { user } = useAuth();
  const { getProfile, toggleFollow, getUserPosts, getFollowers, getFollowing, shareContent } = useContentCreator();
  
  const [profile, setProfile] = useState<CreatorProfileType | null>(null);
  const [posts, setPosts] = useState<CreatorPost[]>([]);
  const [followers, setFollowers] = useState<Array<{ username: string; avatar_url: string }>>([]);
  const [following, setFollowing] = useState<Array<{ username: string; avatar_url: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  async function loadProfile() {
    setLoading(true);
    const profileData = await getProfile(userId);
    setProfile(profileData);
    
    const postsData = await getUserPosts(userId);
    setPosts(postsData);
    
    const followersData = await getFollowers(userId);
    setFollowers(followersData.slice(0, 10));
    
    const followingData = await getFollowing(userId);
    setFollowing(followingData.slice(0, 10));
    
    setLoading(false);
  }

  async function handleFollow() {
    const result = await toggleFollow(userId);
    if (result && profile) {
      setProfile({ ...profile, is_following: true, followers_count: profile.followers_count + 1 });
    } else if (!result && profile) {
      setProfile({ ...profile, is_following: false, followers_count: Math.max(0, profile.followers_count - 1) });
    }
  }

  async function handleShare(post: CreatorPost) {
    await shareContent(post.video_id, post.title);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Creator not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-card rounded-lg shadow-lg overflow-hidden mb-6">
        {/* Cover */}
        <div className="h-32 bg-gradient-to-r from-primary/20 to-primary/5"></div>
        
        {/* Profile Info */}
        <div className="px-6 pb-6">
          <div className="flex items-start justify-between -mt-12">
            <div className="flex items-end gap-4">
              {/* Avatar */}
              <div className="relative">
                <img
                  src={profile.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${profile.username}`}
                  alt={profile.username}
                  className="w-24 h-24 rounded-full border-4 border-card object-cover"
                />
              </div>
              
              {/* Name & Bio */}
              <div className="pb-2">
                <h1 className="text-2xl font-bold">{profile.full_name || profile.username}</h1>
                <p className="text-muted-foreground">@{profile.username}</p>
                {profile.bio && (
                  <p className="text-sm text-muted-foreground mt-2 max-w-md">{profile.bio}</p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pb-2">
              {user && user.id !== userId && (
                <button
                  onClick={handleFollow}
                  className={`px-4 py-2 rounded-md font-medium flex items-center gap-2 ${
                    profile.is_following
                      ? 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                      : 'bg-primary text-primary-foreground hover:bg-primary/90'
                  }`}
                >
                  {profile.is_following ? (
                    <>
                      <Check className="w-4 h-4" />
                      Following
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Follow
                    </>
                  )}
                </button>
              )}
              
              {user && user.id === userId && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium flex items-center gap-2 hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4" />
                  Create
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{profile.posts_count}</span>
              <span className="text-muted-foreground">posts</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{profile.followers_count}</span>
              <span className="text-muted-foreground">followers</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-semibold">{profile.following_count}</span>
              <span className="text-muted-foreground">following</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mt-4 border-b">
            <button
              onClick={() => setActiveTab('posts')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'posts'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Posts
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'followers'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Followers
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-2 font-medium text-sm ${
                activeTab === 'following'
                  ? 'text-primary border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {activeTab === 'posts' && (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground col-span-2">
                No posts yet
              </div>
            ) : (
              posts.map((post) => (
                <CreatorPostCard key={post.id} post={post} onShare={handleShare} />
              ))
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="space-y-2">
            {followers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            ) : (
              followers.map((follower, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <img
                    src={follower.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${follower.username}`}
                    alt={follower.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="font-medium">{follower.username}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-2">
            {following.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone yet
              </div>
            ) : (
              following.map((user, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-card rounded-lg">
                  <img
                    src={user.avatar_url || `https://api.dicebear.com/7.x/identicon/svg?seed=${user.username}`}
                    alt={user.username}
                    className="w-10 h-10 rounded-full"
                  />
                  <span className="font-medium">{user.username}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Create Content Modal */}
      {showCreateModal && (
        <CreateContentModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            loadProfile();
            setShowCreateModal(false);
          }}
        />
      )}
    </div>
  );
}

function CreatorPostCard({ post, onShare }: { post: CreatorPost; onShare: (post: CreatorPost) => void }) {
  const { toggleLike, addComment, likeCount, liked, comments } = useVideoSocial(post.video_id);
  
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  async function handleLike() {
    await toggleLike();
  }

  async function handleComment() {
    if (!commentText.trim()) return;
    await addComment(commentText.trim());
    setCommentText('');
  }

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      {/* Thumbnail */}
      <div className="aspect-video bg-muted relative">
        {post.thumbnail_url ? (
          <img src={post.thumbnail_url} alt={post.title} className="w-full h-full object-cover" />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Video className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold line-clamp-2">{post.title}</h3>
        {post.description && (
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{post.description}</p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm ${liked ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} />
            {likeCount}
          </button>
          
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <MessageCircle className="w-4 h-4" />
            {comments.length}
          </button>
          
          <button
            onClick={() => onShare(post)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground ml-auto"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>

        {/* Comments */}
        {showComments && (
          <div className="mt-4 pt-4 border-t">
            <div className="space-y-2 mb-3">
              {comments.map((comment) => (
                <div key={comment.id} className="text-sm">
                  <span className="font-medium">{comment.userId.slice(0, 8)}...</span>
                  <span className="ml-2">{comment.text}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 px-3 py-2 text-sm bg-background border rounded-md"
                onKeyPress={(e) => e.key === 'Enter' && handleComment()}
              />
              <button
                onClick={handleComment}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md"
              >
                Post
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateContentModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { createPost, isCreating } = useContentCreator();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!title.trim() || !videoUrl.trim()) {
      toast.error("Title and video URL are required");
      return;
    }

    const result = await createPost({
      title,
      description,
      video_url: videoUrl,
      thumbnail_url: thumbnailUrl || undefined,
    });

    if (result) {
      onSuccess();
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">Create New Content</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
                placeholder="Enter video title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
                rows={3}
                placeholder="Describe your video"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Video URL *</label>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
                placeholder="https://example.com/video.mp4 or YouTube URL"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Thumbnail URL</label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                className="w-full px-3 py-2 bg-background border rounded-md"
                placeholder="https://example.com/thumbnail.jpg"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}