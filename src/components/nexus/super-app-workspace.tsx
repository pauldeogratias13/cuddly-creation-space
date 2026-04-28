import { Link } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  MessageSquare,
  ShoppingBag,
  Sparkles,
  Tv,
  Globe,
  Gamepad2,
  Cpu,
  Bot,
  Settings,
  Bell,
  BookOpen,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { STREAM_LIBRARY } from "@/lib/demo-videos";
import { ProfileSettingsForm } from "@/components/nexus/profile-settings-form";
import { VideoPlayer } from "@/components/nexus/VideoPlayer";
import {
  AI_TWIN_BRIEFING_STORAGE_KEY,
  BLUEPRINT_KEY_THEMES,
  BLUEPRINT_SECTIONS,
  BLUEPRINT_SOURCE,
  SUBSCRIPTION_TIER_CARDS,
} from "@/lib/nexus-blueprint";

type Message = {
  id: string;
  from: "me" | "system";
  text: string;
  at: string;
  createdAtIso: string;
};
type ChatThread = {
  id: string;
  title: string;
  isPinned: boolean;
  lastMessagePreview: string;
  lastMessageAtIso: string | null;
  lastMessageSender: "me" | "system" | null;
  unreadCount: number;
};
type Post = { id: string; userId: string; text: string; likes: number; liked: boolean };
type CartItem = { id: string; name: string; price: number; quantity: number };
type OrderSummary = {
  id: string;
  total: number;
  status: string;
  createdAt: string;
  createdAtIso: string;
  itemSummary: string;
};
type Comment = { id: string; postId: string; userId: string; text: string };
type StreamItem = {
  id: string;
  title: string;
  category: "Cinema" | "Series" | "Docs";
  duration: string;
  videoSources: string[];
  poster: string;
  description: string;
};
type NotificationType = "chat" | "social_comment" | "commerce" | "profile" | string;
type Notification = {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
  createdAtIso: string;
};
type RealtimePayload<T> = { new: T };
const PAGE_SIZE = 20;
const ORDERS_PAGE = 5;

function sortThreads(threads: ChatThread[]) {
  return [...threads].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return Number(b.isPinned) - Number(a.isPinned);
    const aTs = a.lastMessageAtIso ? new Date(a.lastMessageAtIso).getTime() : 0;
    const bTs = b.lastMessageAtIso ? new Date(b.lastMessageAtIso).getTime() : 0;
    return bTs - aTs;
  });
}

function toRelativeTime(iso: string | null) {
  if (!iso) return "No activity";
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffSec = Math.max(0, Math.floor((now - then) / 1000));
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h ago`;
  const diffDay = Math.floor(diffHour / 24);
  return `${diffDay}d ago`;
}

const shopCatalog = [
  { id: "escrow-plan", name: "Escrow Plus", price: 9 },
  { id: "creator-pass", name: "Creator Pass", price: 19 },
  { id: "priority-support", name: "Priority Support", price: 7 },
];

const seedStreamLibrary: StreamItem[] = STREAM_LIBRARY;

type RemoteVideoHit = {
  id: string;
  title: string;
  description?: string;
  poster?: string;
  source: string;
  origin: string;
  durationLabel?: string;
};

const pillarTabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "commerce", label: "Commerce", icon: ShoppingBag },
  { id: "social", label: "Social", icon: Sparkles },
  { id: "streaming", label: "Streaming", icon: Tv },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "nexos", label: "NexOS", icon: Cpu },
  { id: "ai", label: "AI Twin", icon: Bot },
  { id: "blueprint", label: "Blueprint", icon: BookOpen },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type PillarTab = (typeof pillarTabs)[number]["id"];

export function SuperAppWorkspace({ name }: { name: string }) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<PillarTab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [oldestMessageCursor, setOldestMessageCursor] = useState<string | null>(null);
  const [showJumpNewest, setShowJumpNewest] = useState(false);
  const [, setRelativeTimeTick] = useState(0);
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [newThreadTitle, setNewThreadTitle] = useState("");
  const [renameThreadId, setRenameThreadId] = useState<string | null>(null);
  const [renameThreadValue, setRenameThreadValue] = useState("");
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentInputByPost, setCommentInputByPost] = useState<Record<string, string>>({});
  const [likedPostIds, setLikedPostIds] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [ordersHasMore, setOrdersHasMore] = useState(false);
  const [ordersLoadingMore, setOrdersLoadingMore] = useState(false);
  const [oldestOrderCursorIso, setOldestOrderCursorIso] = useState<string | null>(null);
  const [orderItemsById, setOrderItemsById] = useState<Record<string, string[]>>({});
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsHasMore, setNotificationsHasMore] = useState(false);
  const [notificationsLoadingMore, setNotificationsLoadingMore] = useState(false);
  const [oldestNotificationCursor, setOldestNotificationCursor] = useState<string | null>(null);
  const [tabLoading, setTabLoading] = useState<Record<PillarTab, boolean>>({
    chat: false,
    commerce: false,
    social: false,
    streaming: false,
    gaming: false,
    nexos: false,
    ai: false,
    blueprint: false,
    notifications: false,
    settings: false,
  });
  const [notificationFilter, setNotificationFilter] = useState<
    "all" | "chat" | "social_comment" | "commerce" | "profile"
  >("all");
  const [highScore, setHighScore] = useState(0);
  const [apps, setApps] = useState<{ id: string; name: string }[]>([]);
  const [booting, setBooting] = useState(true);
  const [streamFilter, setStreamFilter] = useState<StreamItem["category"] | "All">("All");
  const [streamSearch, setStreamSearch] = useState("");
  const [streamLibrary, setStreamLibrary] = useState<StreamItem[]>(seedStreamLibrary);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamSearchError, setStreamSearchError] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [appInput, setAppInput] = useState("");
  const [intentInput, setIntentInput] = useState("");
  const [socialSearch, setSocialSearch] = useState("");
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editingPostText, setEditingPostText] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingMessageText, setEditingMessageText] = useState("");
  const [clicks, setClicks] = useState(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const stickChatToBottomRef = useRef(true);
  const [aiResponse, setAiResponse] = useState(
    "Tell your AI Twin what you want to do and it will route you to the right pillar.",
  );
  const [twinBriefing, setTwinBriefing] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(AI_TWIN_BRIEFING_STORAGE_KEY);
      if (saved) setTwinBriefing(saved);
    } catch {
      /* ignore */
    }
  }, []);

  const filteredStreams = useMemo(() => {
    const byCat = streamLibrary.filter((s) => streamFilter === "All" || s.category === streamFilter);
    const q = streamSearch.trim().toLowerCase();
    if (!q) return byCat;
    return byCat.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.category.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q),
    );
  }, [streamFilter, streamSearch]);

  // Live video discovery — debounced fetch to /api/videos/search.
  // Hits the always-on CDN catalog instantly + Internet Archive when reachable.
  // Server HEAD-verifies each URL; player drops anything that still fails.
  useEffect(() => {
    const ac = new AbortController();
    const timer = window.setTimeout(async () => {
      setStreamLoading(true);
      setStreamSearchError(null);
      try {
        const params = new URLSearchParams({
          q: streamSearch.trim(),
          limit: "16",
        });
        const res = await fetch(`/api/videos/search?${params}`, { signal: ac.signal });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const data = (await res.json()) as { results: RemoteVideoHit[] };
        const mapped: StreamItem[] = data.results.map((r) => ({
          id: r.id,
          title: r.title,
          description: r.description ?? "Live source verified by NEXUS.",
          category:
            /trailer|short|clip|news/i.test(r.title) ? "Series"
              : /doc|nature|space|history/i.test(`${r.title} ${r.description ?? ""}`) ? "Docs"
              : "Cinema",
          duration: r.durationLabel ?? "—",
          videoSources: [r.source],
          poster: r.poster ?? "",
        }));
        // Keep at least the seed library if the search returned nothing.
        setStreamLibrary(mapped.length ? mapped : seedStreamLibrary);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setStreamSearchError(err instanceof Error ? err.message : "Search failed");
        setStreamLibrary(seedStreamLibrary);
      } finally {
        setStreamLoading(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [streamSearch]);

  // Drop a stream item whose every source failed to load in the player.
  const removeBrokenStream = (id: string) => {
    setStreamLibrary((prev) => prev.filter((s) => s.id !== id));
    setPlaybackStreamId((prev) => (prev === id ? null : prev));
  };
  const [playbackStreamId, setPlaybackStreamId] = useState<string | null>(null);

  useEffect(() => {
    if (filteredStreams.length === 0) {
      setPlaybackStreamId(null);
      return;
    }
    setPlaybackStreamId((prev) =>
      prev && filteredStreams.some((s) => s.id === prev) ? prev : filteredStreams[0].id,
    );
  }, [filteredStreams]);

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  const cartUnits = useMemo(() => cart.reduce((n, item) => n + item.quantity, 0), [cart]);
  const filteredPosts = useMemo(() => {
    const q = socialSearch.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter((p) => p.text.toLowerCase().includes(q));
  }, [posts, socialSearch]);

  useEffect(() => {
    if (!editingPostId && !editingCommentId && !editingMessageId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setEditingPostId(null);
      setEditingPostText("");
      setEditingCommentId(null);
      setEditingCommentText("");
      setEditingMessageId(null);
      setEditingMessageText("");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [editingPostId, editingCommentId, editingMessageId]);

  const playbackStream = useMemo(
    () => filteredStreams.find((s) => s.id === playbackStreamId) ?? null,
    [filteredStreams, playbackStreamId],
  );
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "all") return notifications;
    return notifications.filter((n) => n.type === notificationFilter);
  }, [notifications, notificationFilter]);

  const selectedThread = useMemo(
    () => threads.find((t) => t.id === selectedThreadId) ?? null,
    [threads, selectedThreadId],
  );

  useEffect(() => {
    const id = window.setInterval(() => setRelativeTimeTick((n) => n + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!user) return;
    let active = true;

    const bootstrap = async () => {
      setTabLoading({
        chat: true,
        commerce: true,
        social: true,
        streaming: true,
        gaming: true,
        nexos: true,
        ai: false,
        blueprint: false,
        notifications: true,
        settings: true,
      });
      setBooting(true);
      const messagesQuery = supabase
        .from("chat_messages")
        .select("id, sender, text, created_at, thread_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      const messagesScopedQuery = selectedThreadId
        ? messagesQuery.eq("thread_id", selectedThreadId)
        : messagesQuery;

      const [threadsRes, threadReadsRes, threadMessagesRes, messagesRes, postsRes, likesRes, watchlistRes, appsRes, scoreRes, ordersRes, notificationsRes, cartRes] = await Promise.all([
        supabase
          .from("chat_threads")
          .select("id, title, is_pinned")
          .eq("user_id", user.id)
          .order("is_pinned", { ascending: false })
          .order("created_at", { ascending: true }),
        supabase
          .from("chat_thread_reads")
          .select("thread_id, last_read_at")
          .eq("user_id", user.id),
        supabase
          .from("chat_messages")
          .select("thread_id, sender, text, created_at")
          .eq("user_id", user.id)
          .not("thread_id", "is", null)
          .order("created_at", { ascending: false })
          .limit(300),
        messagesScopedQuery,
        supabase.from("social_posts").select("id, user_id, text, likes_count, created_at").order("created_at", { ascending: false }).limit(30),
        supabase.from("social_post_likes").select("post_id").eq("user_id", user.id),
        supabase.from("user_watchlist").select("stream_id").eq("user_id", user.id),
        supabase.from("nexos_apps").select("id, name").eq("user_id", user.id).order("created_at", { ascending: false }),
        supabase.from("gaming_scores").select("high_score").eq("user_id", user.id).maybeSingle(),
        supabase
          .from("commerce_orders")
          .select("id, total_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(ORDERS_PAGE),
        supabase
          .from("user_notifications")
          .select("id, type, title, body, read_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
        supabase
          .from("commerce_cart_items")
          .select("product_id, product_name, unit_price, quantity")
          .eq("user_id", user.id),
      ]);

      if (!active) return;
      if (
        threadsRes.error ||
        threadReadsRes.error ||
        threadMessagesRes.error ||
        messagesRes.error ||
        postsRes.error ||
        likesRes.error ||
        watchlistRes.error ||
        appsRes.error ||
        scoreRes.error ||
        ordersRes.error ||
        notificationsRes.error ||
        cartRes.error
      ) {
        toast.error("Some modules failed to load from Supabase");
      }

      const readMap = new Map<string, string>(
        (threadReadsRes.data ?? []).map((r: { thread_id: string; last_read_at: string }) => [
          r.thread_id,
          r.last_read_at,
        ]),
      );
      const latestMessageMap = new Map<string, string>();
      const latestMessageAtMap = new Map<string, string>();
      const latestMessageSenderMap = new Map<string, "me" | "system">();
      const unreadMap = new Map<string, number>();
      (threadMessagesRes.data ?? []).forEach(
        (m: {
          thread_id: string | null;
          sender: string;
          text: string;
          created_at: string;
        }) => {
          if (!m.thread_id) return;
          if (!latestMessageMap.has(m.thread_id)) {
            latestMessageMap.set(m.thread_id, m.text);
            latestMessageAtMap.set(m.thread_id, m.created_at);
            latestMessageSenderMap.set(m.thread_id, m.sender as "me" | "system");
          }
          const lastRead = readMap.get(m.thread_id);
          const isUnread =
            m.sender !== "me" && (!lastRead || new Date(m.created_at) > new Date(lastRead));
          if (isUnread) {
            unreadMap.set(m.thread_id, (unreadMap.get(m.thread_id) ?? 0) + 1);
          }
        },
      );
      const threadData = (threadsRes.data ?? []).map(
        (t: { id: string; title: string; is_pinned: boolean }) => ({
          id: t.id,
          title: t.title,
          isPinned: t.is_pinned,
          lastMessagePreview: latestMessageMap.get(t.id) ?? "No messages yet",
          lastMessageAtIso: latestMessageAtMap.get(t.id) ?? null,
          lastMessageSender: latestMessageSenderMap.get(t.id) ?? null,
          unreadCount: unreadMap.get(t.id) ?? 0,
        }),
      );
      setThreads(sortThreads(threadData));
      if (!selectedThreadId && threadData.length > 0) setSelectedThreadId(threadData[0].id);

      setMessages(
        (messagesRes.data ?? [])
          .slice()
          .reverse()
          .map((m: { id: string; sender: string; text: string; created_at: string }) => ({
            id: m.id,
            from: m.sender as "me" | "system",
            text: m.text,
            at: new Date(m.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            createdAtIso: m.created_at,
          })),
      );
      setMessagesHasMore((messagesRes.data ?? []).length === PAGE_SIZE);
      setOldestMessageCursor(
        (messagesRes.data ?? []).length > 0
          ? (messagesRes.data ?? [])[messagesRes.data!.length - 1].created_at
          : null,
      );
      setShowJumpNewest(false);
      setPosts(
        (postsRes.data ?? []).map((p: { id: string; user_id: string; text: string; likes_count: number }) => ({
          id: p.id,
          userId: p.user_id,
          text: p.text,
          likes: p.likes_count,
          liked: false,
        })),
      );
      const postIds = (postsRes.data ?? []).map((p: { id: string }) => p.id);
      const commentsRes =
        postIds.length === 0
          ? { data: [], error: null as { message: string } | null }
          : await supabase
              .from("social_comments")
              .select("id, post_id, user_id, text, created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true });
      setComments(
        (commentsRes.data ?? []).map((c: { id: string; post_id: string; user_id: string; text: string }) => ({
          id: c.id,
          postId: c.post_id,
          userId: c.user_id,
          text: c.text,
        })),
      );
      const likes = (likesRes.data ?? []).map((x: { post_id: string }) => x.post_id);
      setLikedPostIds(likes);
      setWatchlist((watchlistRes.data ?? []).map((w: { stream_id: string }) => w.stream_id));
      setNotifications(
        (notificationsRes.data ?? []).map((n: {
          id: string;
          type: string;
          title: string;
          body: string | null;
          read_at: string | null;
          created_at: string;
        }) => ({
          id: n.id,
          type: n.type,
          title: n.title,
          body: n.body,
          readAt: n.read_at,
          createdAt: new Date(n.created_at).toLocaleString(),
          createdAtIso: n.created_at,
        })),
      );
      setNotificationsHasMore((notificationsRes.data ?? []).length === PAGE_SIZE);
      setOldestNotificationCursor(
        (notificationsRes.data ?? []).length > 0
          ? (notificationsRes.data ?? [])[notificationsRes.data!.length - 1].created_at
          : null,
      );
      setApps((appsRes.data ?? []).map((a: { id: string; name: string }) => ({ id: a.id, name: a.name })));
      setCart(
        (cartRes.data ?? []).map((row: { product_id: string; product_name: string; unit_price: number; quantity: number }) => ({
          id: row.product_id,
          name: row.product_name,
          price: Number(row.unit_price),
          quantity: row.quantity,
        })),
      );
      setHighScore(scoreRes.data?.high_score ?? 0);
      const orderIds = (ordersRes.data ?? []).map((o: { id: string }) => o.id);
      const orderItemsRes =
        orderIds.length === 0
          ? { data: [], error: null as { message: string } | null }
          : await supabase
              .from("commerce_order_items")
              .select("order_id, product_name, quantity")
              .in("order_id", orderIds);
      const itemMap = new Map<string, string[]>();
      (orderItemsRes.data ?? []).forEach((item: { order_id: string; product_name: string; quantity: number }) => {
        const list = itemMap.get(item.order_id) ?? [];
        list.push(`${item.product_name} x${item.quantity}`);
        itemMap.set(item.order_id, list);
      });

      const orderRows = ordersRes.data ?? [];
      setOrders(
        orderRows.map((o: { id: string; total_amount: number; status: string; created_at: string }) => ({
          id: o.id,
          total: o.total_amount,
          status: o.status,
          createdAt: new Date(o.created_at).toLocaleDateString(),
          createdAtIso: o.created_at,
          itemSummary: (itemMap.get(o.id) ?? []).join(", ") || "No items",
        })),
      );
      setOrdersHasMore(orderRows.length === ORDERS_PAGE);
      setOldestOrderCursorIso(
        orderRows.length > 0 ? orderRows[orderRows.length - 1].created_at : null,
      );
      setBooting(false);
      setTabLoading((prev) =>
        Object.fromEntries(
          Object.keys(prev).map((k) => [k, false]),
        ) as Record<PillarTab, boolean>,
      );
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, [user, selectedThreadId]);

  useEffect(() => {
    stickChatToBottomRef.current = true;
  }, [selectedThreadId]);

  const updateChatStickFromScroll = () => {
    const el = chatScrollRef.current;
    if (!el) return;
    const threshold = 72;
    stickChatToBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight <= threshold;
  };

  useLayoutEffect(() => {
    const el = chatScrollRef.current;
    if (!el || activeTab !== "chat") return;
    if (stickChatToBottomRef.current) {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, activeTab]);

  useEffect(() => {
    if (!user) return;
    const syncCartFromDb = async () => {
      const { data, error } = await supabase
        .from("commerce_cart_items")
        .select("product_id, product_name, unit_price, quantity")
        .eq("user_id", user.id);
      if (error) return;
      setCart(
        (data ?? []).map((row: { product_id: string; product_name: string; unit_price: number; quantity: number }) => ({
          id: row.product_id,
          name: row.product_name,
          price: Number(row.unit_price),
          quantity: row.quantity,
        })),
      );
    };

    const channel = supabase
      .channel(`nexus-realtime-${user.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; sender: string; text: string; created_at: string; thread_id: string | null }>) => {
          const row = payload.new as {
            id: string;
            sender: string;
            text: string;
            created_at: string;
            thread_id: string | null;
          };
          const appendToMessages =
            (selectedThreadId != null && row.thread_id === selectedThreadId) ||
            (selectedThreadId == null && row.thread_id == null);
          if (appendToMessages) {
            setMessages((prev) => {
              if (prev.some((m) => m.id === row.id)) return prev;
              return [
                ...prev,
                {
                  id: row.id,
                  from: row.sender as "me" | "system",
                  text: row.text,
                  at: new Date(row.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
                  createdAtIso: row.created_at,
                },
              ];
            });
          }
          if (row.thread_id) {
            setThreads((prev) =>
              sortThreads(
                prev.map((t) => {
                  if (t.id !== row.thread_id) return t;
                  const nextUnread =
                    row.sender !== "me" && selectedThreadId !== row.thread_id
                      ? t.unreadCount + 1
                      : t.unreadCount;
                  return {
                    ...t,
                    lastMessagePreview: row.text,
                    lastMessageAtIso: row.created_at,
                    lastMessageSender: row.sender as "me" | "system",
                    unreadCount: nextUnread,
                  };
                }),
              ),
            );
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (payload: { old?: { id: string } }) => {
          const id = payload.old?.id;
          if (!id) return;
          setMessages((prev) => prev.filter((m) => m.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_messages", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; text: string; created_at: string; thread_id: string | null }>) => {
          const row = payload.new as {
            id: string;
            text: string;
            created_at: string;
            thread_id: string | null;
          };
          const inView =
            (selectedThreadId != null && row.thread_id === selectedThreadId) ||
            (selectedThreadId == null && row.thread_id == null);
          if (!inView) return;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === row.id
                ? {
                    ...m,
                    text: row.text,
                    at: new Date(row.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                    createdAtIso: row.created_at,
                  }
                : m,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_threads", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; title: string; is_pinned?: boolean }>) => {
          const row = payload.new as { id: string; title: string; is_pinned?: boolean };
          setThreads((prev) => {
            if (prev.some((t) => t.id === row.id)) return prev;
            return sortThreads([
              ...prev,
              {
                id: row.id,
                title: row.title,
                isPinned: Boolean(row.is_pinned),
                lastMessagePreview: "No messages yet",
                lastMessageAtIso: null,
                lastMessageSender: null,
                unreadCount: 0,
              },
            ]);
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "chat_threads", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; title: string; is_pinned: boolean }>) => {
          const row = payload.new as { id: string; title: string; is_pinned: boolean };
          setThreads((prev) =>
            sortThreads(
              prev.map((t) =>
                t.id === row.id ? { ...t, title: row.title, isPinned: row.is_pinned } : t,
              ),
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_threads", filter: `user_id=eq.${user.id}` },
        (payload: { old?: { id: string } }) => {
          const tid = payload.old?.id;
          if (!tid) return;
          setThreads((prev) => {
            const filtered = sortThreads(prev.filter((t) => t.id !== tid));
            setSelectedThreadId((cur) => {
              if (cur !== tid) return cur;
              setMessages([]);
              return filtered[0]?.id ?? null;
            });
            return filtered;
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; type: string; title: string; body: string | null; read_at: string | null; created_at: string }>) => {
          const row = payload.new as {
            id: string;
            type: string;
            title: string;
            body: string | null;
            read_at: string | null;
            created_at: string;
          };
          setNotifications((prev) => [
            {
              id: row.id,
              type: row.type,
              title: row.title,
              body: row.body,
              readAt: row.read_at,
              createdAt: new Date(row.created_at).toLocaleString(),
              createdAtIso: row.created_at,
            },
            ...prev,
          ]);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_posts" },
        (payload: RealtimePayload<{ id: string; user_id: string; text: string; likes_count: number }>) => {
          const row = payload.new as { id: string; user_id: string; text: string; likes_count: number };
          setPosts((prev) =>
            prev.some((p) => p.id === row.id)
              ? prev
              : [{ id: row.id, userId: row.user_id, text: row.text, likes: row.likes_count, liked: false }, ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "social_posts" },
        (payload: RealtimePayload<{ id: string; likes_count: number; text: string }>) => {
          const row = payload.new as { id: string; likes_count: number; text: string };
          if (!row?.id) return;
          setPosts((prev) =>
            prev.map((p) =>
              p.id === row.id ? { ...p, likes: row.likes_count, text: row.text ?? p.text } : p,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_posts" },
        (payload: { old?: { id: string } }) => {
          const id = payload.old?.id;
          if (!id) return;
          setPosts((prev) => prev.filter((p) => p.id !== id));
          setComments((prev) => prev.filter((c) => c.postId !== id));
          setLikedPostIds((prev) => prev.filter((pid) => pid !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_comments" },
        (payload: RealtimePayload<{ id: string; post_id: string; user_id: string; text: string }>) => {
          const row = payload.new as { id: string; post_id: string; user_id: string; text: string };
          setComments((prev) =>
            prev.some((c) => c.id === row.id)
              ? prev
              : [...prev, { id: row.id, postId: row.post_id, userId: row.user_id, text: row.text }],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "social_comments" },
        (payload: RealtimePayload<{ id: string; text: string }>) => {
          const row = payload.new as { id: string; text: string };
          if (!row?.id) return;
          setComments((prev) => prev.map((c) => (c.id === row.id ? { ...c, text: row.text } : c)));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_comments" },
        (payload: { old?: { id: string } }) => {
          const id = payload.old?.id;
          if (!id) return;
          setComments((prev) => prev.filter((c) => c.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_post_likes" },
        (payload: RealtimePayload<{ post_id: string; user_id: string }>) => {
          const row = payload.new as { post_id: string; user_id: string };
          if (row.user_id !== user.id) {
            setPosts((prev) => prev.map((p) => (p.id === row.post_id ? { ...p, likes: p.likes + 1 } : p)));
          }
          if (row.user_id === user.id) {
            setLikedPostIds((prev) => (prev.includes(row.post_id) ? prev : [...prev, row.post_id]));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_post_likes" },
        (payload: { old?: { post_id: string; user_id: string } }) => {
          const row = payload.old;
          if (!row?.post_id) return;
          if (row.user_id !== user.id) {
            setPosts((prev) =>
              prev.map((p) => (p.id === row.post_id ? { ...p, likes: Math.max(0, p.likes - 1) } : p)),
            );
          }
          if (row.user_id === user.id) {
            setLikedPostIds((prev) => prev.filter((id) => id !== row.post_id));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "user_watchlist", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ stream_id: string }>) => {
          const row = payload.new as { stream_id: string };
          setWatchlist((prev) => (prev.includes(row.stream_id) ? prev : [...prev, row.stream_id]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_watchlist", filter: `user_id=eq.${user.id}` },
        (payload: { old?: { stream_id: string } }) => {
          const streamId = payload.old?.stream_id;
          if (!streamId) return;
          setWatchlist((prev) => prev.filter((id) => id !== streamId));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nexos_apps", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; name: string }>) => {
          const row = payload.new as { id: string; name: string };
          setApps((prev) => (prev.some((a) => a.id === row.id) ? prev : [row, ...prev]));
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "nexos_apps", filter: `user_id=eq.${user.id}` },
        (payload: { old?: { id: string } }) => {
          const id = payload.old?.id;
          if (!id) return;
          setApps((prev) => prev.filter((a) => a.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "gaming_scores", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ high_score: number }>) => {
          const row = payload.new as { high_score: number };
          if (typeof row?.high_score === "number") setHighScore(row.high_score);
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "commerce_orders", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; total_amount: number; status: string; created_at: string }>) => {
          const row = payload.new as { id: string; total_amount: number; status: string; created_at: string };
          setOrders((prev) => {
            if (prev.some((o) => o.id === row.id)) return prev;
            const entry: OrderSummary = {
              id: row.id,
              total: Number(row.total_amount),
              status: row.status,
              createdAt: new Date(row.created_at).toLocaleDateString(),
              createdAtIso: row.created_at,
              itemSummary: "Open order to load line items",
            };
            return [entry, ...prev.filter((o) => o.id !== row.id).slice(0, ORDERS_PAGE - 1)];
          });
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commerce_orders", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; total_amount: number; status: string; created_at: string }>) => {
          const row = payload.new as {
            id: string;
            total_amount: number;
            status: string;
            created_at: string;
          };
          setOrders((prev) =>
            prev.map((o) =>
              o.id === row.id
                ? {
                    ...o,
                    total: Number(row.total_amount),
                    status: row.status,
                    createdAt: new Date(row.created_at).toLocaleDateString(),
                    createdAtIso: row.created_at,
                  }
                : o,
            ),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload: { old?: { id: string } }) => {
          const id = payload.old?.id;
          if (!id) return;
          setNotifications((prev) => prev.filter((n) => n.id !== id));
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "user_notifications", filter: `user_id=eq.${user.id}` },
        (payload: RealtimePayload<{ id: string; read_at: string | null }>) => {
          const row = payload.new as { id: string; read_at: string | null };
          if (!row?.id) return;
          setNotifications((prev) =>
            prev.map((n) => (n.id === row.id ? { ...n, readAt: row.read_at } : n)),
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "commerce_cart_items", filter: `user_id=eq.${user.id}` },
        () => {
          void syncCartFromDb();
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commerce_cart_items", filter: `user_id=eq.${user.id}` },
        () => {
          void syncCartFromDb();
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "commerce_cart_items", filter: `user_id=eq.${user.id}` },
        () => {
          void syncCartFromDb();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, selectedThreadId]);

  useEffect(() => {
    setPosts((prev) => prev.map((p) => ({ ...p, liked: likedPostIds.includes(p.id) })));
  }, [likedPostIds]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const run = async () => {
      setNotificationsLoadingMore(true);
      let query = supabase
        .from("user_notifications")
        .select("id, type, title, body, read_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);
      if (notificationFilter !== "all") {
        query = query.eq("type", notificationFilter);
      }
      const { data, error } = await query;
      if (!active) return;
      setNotificationsLoadingMore(false);
      if (error) return toast.error("Failed to load filtered notifications");
      const next = (data ?? []).map((n: {
        id: string;
        type: string;
        title: string;
        body: string | null;
        read_at: string | null;
        created_at: string;
      }) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        body: n.body,
        readAt: n.read_at,
        createdAt: new Date(n.created_at).toLocaleString(),
        createdAtIso: n.created_at,
      }));
      setNotifications(next);
      setNotificationsHasMore((data ?? []).length === PAGE_SIZE);
      setOldestNotificationCursor(
        (data ?? []).length > 0 ? (data ?? [])[data!.length - 1].created_at : null,
      );
    };
    run();
    return () => {
      active = false;
    };
  }, [notificationFilter, user]);

  const submitChat = async () => {
    if (!user) return;
    const text = chatInput.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({ user_id: user.id, sender: "me", text, thread_id: selectedThreadId })
      .select("id, sender, text, created_at")
      .single();
    if (error || !data) {
      toast.error("Message failed to send");
      return;
    }
    stickChatToBottomRef.current = true;
    setMessages((prev) => [
      ...prev,
      {
        id: data.id,
        from: "me",
        text: data.text,
        at: new Date(data.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAtIso: data.created_at,
      },
    ]);
    setChatInput("");
    setTimeout(async () => {
      await supabase
        .from("chat_messages")
        .insert({
          user_id: user.id,
          sender: "system",
          text: "Relay received. Message queued with secure routing.",
          thread_id: selectedThreadId,
        });
      await supabase.from("user_notifications").insert({
        user_id: user.id,
        type: "chat",
        title: "New relay update",
        body: "A secure relay message was added to your conversation.",
      });
    }, 250);
  };

  const createThread = async () => {
    if (!user) return;
    const title = newThreadTitle.trim();
    if (!title) return;
    const { data, error } = await supabase
      .from("chat_threads")
      .insert({ user_id: user.id, title })
      .select("id, title")
      .single();
    if (error || !data) {
      toast.error("Could not create conversation");
      return;
    }
    setThreads((prev) => [
      ...prev,
      {
        ...data,
        isPinned: false,
        lastMessagePreview: "No messages yet",
        lastMessageAtIso: null,
        lastMessageSender: null,
        unreadCount: 0,
      },
    ]);
    setSelectedThreadId(data.id);
    setMessages([]);
    setNewThreadTitle("");
    stickChatToBottomRef.current = true;
  };

  const startRenameThread = (thread: ChatThread) => {
    setRenameThreadId(thread.id);
    setRenameThreadValue(thread.title);
  };

  const saveRenameThread = async () => {
    if (!renameThreadId) return;
    const nextTitle = renameThreadValue.trim();
    if (!nextTitle) return;
    const { error } = await supabase
      .from("chat_threads")
      .update({ title: nextTitle })
      .eq("id", renameThreadId);
    if (error) {
      toast.error("Could not rename conversation");
      return;
    }
    setThreads((prev) =>
      prev.map((t) =>
        t.id === renameThreadId ? { ...t, title: nextTitle } : t,
      ),
    );
    setRenameThreadId(null);
    setRenameThreadValue("");
  };

  const deleteThread = async (threadId: string) => {
    const { error } = await supabase.from("chat_threads").delete().eq("id", threadId);
    if (error) {
      toast.error("Could not delete conversation");
      return;
    }
    const remaining = threads.filter((t) => t.id !== threadId);
    setThreads(remaining);
    if (selectedThreadId === threadId) {
      setSelectedThreadId(remaining[0]?.id ?? null);
      setMessages([]);
      stickChatToBottomRef.current = true;
    }
  };

  const togglePinThread = async (thread: ChatThread) => {
    const { error } = await supabase
      .from("chat_threads")
      .update({ is_pinned: !thread.isPinned })
      .eq("id", thread.id);
    if (error) return toast.error("Could not update pin");
    setThreads((prev) =>
      sortThreads(
        prev
        .map((t) =>
          t.id === thread.id ? { ...t, isPinned: !t.isPinned } : t,
        )
      ),
    );
  };

  const markThreadRead = async (threadId: string) => {
    if (!user) return;
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("chat_thread_reads")
      .upsert({ thread_id: threadId, user_id: user.id, last_read_at: nowIso });
    if (!error) {
      setThreads((prev) =>
        prev.map((t) =>
          t.id === threadId ? { ...t, unreadCount: 0 } : t,
        ),
      );
    }
  };

  const beginEditMessage = (message: Message) => {
    if (message.from !== "me") return;
    setEditingPostId(null);
    setEditingPostText("");
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingMessageId(message.id);
    setEditingMessageText(message.text);
  };

  const cancelEditMessage = () => {
    setEditingMessageId(null);
    setEditingMessageText("");
  };

  const saveMessageEdit = async () => {
    if (!user || !editingMessageId) return;
    const text = editingMessageText.trim();
    if (!text) {
      toast.error("Message cannot be empty");
      return;
    }
    const { data, error } = await supabase
      .from("chat_messages")
      .update({ text })
      .eq("id", editingMessageId)
      .eq("user_id", user.id)
      .select("id, text, created_at")
      .single();
    if (error || !data) return toast.error("Could not update message");
    setMessages((prev) =>
      prev.map((m) =>
        m.id === editingMessageId
          ? {
              ...m,
              text: data.text,
              at: new Date(data.created_at).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              createdAtIso: data.created_at,
            }
          : m,
      ),
    );
    cancelEditMessage();
    toast.success("Message updated");
  };

  const deleteOwnMessage = async (message: Message) => {
    if (!user || message.from !== "me") return;
    if (editingMessageId === message.id) cancelEditMessage();
    const { error } = await supabase.from("chat_messages").delete().eq("id", message.id);
    if (error) return toast.error("Could not delete message");
    setMessages((prev) => prev.filter((m) => m.id !== message.id));
  };

  const publishPost = async () => {
    if (!user) return;
    const text = postInput.trim();
    if (!text) return;
    const { data, error } = await supabase
      .from("social_posts")
      .insert({ user_id: user.id, text })
      .select("id, user_id, text, likes_count")
      .single();
    if (error || !data) {
      toast.error("Failed to publish post");
      return;
    }
    setPosts((prev) => [
      { id: data.id, userId: data.user_id, text: data.text, likes: data.likes_count, liked: false },
      ...prev,
    ]);
    setPostInput("");
    toast.success("Post published");
  };

  const deletePost = async (post: Post) => {
    if (!user || post.userId !== user.id) return;
    const { error } = await supabase.from("social_posts").delete().eq("id", post.id);
    if (error) return toast.error("Could not delete post");
    if (editingPostId === post.id) {
      setEditingPostId(null);
      setEditingPostText("");
    }
    setPosts((prev) => prev.filter((p) => p.id !== post.id));
    setComments((prev) => prev.filter((c) => c.postId !== post.id));
    setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
  };

  const beginEditPost = (post: Post) => {
    if (user?.id !== post.userId) return;
    setEditingCommentId(null);
    setEditingCommentText("");
    setEditingMessageId(null);
    setEditingMessageText("");
    setEditingPostId(post.id);
    setEditingPostText(post.text);
  };

  const cancelEditPost = () => {
    setEditingPostId(null);
    setEditingPostText("");
  };

  const savePostEdit = async () => {
    if (!user || !editingPostId) return;
    const text = editingPostText.trim();
    if (!text) {
      toast.error("Post text cannot be empty");
      return;
    }
    const { error } = await supabase
      .from("social_posts")
      .update({ text })
      .eq("id", editingPostId)
      .eq("user_id", user.id);
    if (error) return toast.error("Could not update post");
    setPosts((prev) => prev.map((p) => (p.id === editingPostId ? { ...p, text } : p)));
    cancelEditPost();
    toast.success("Post updated");
  };

  const beginEditComment = (comment: Comment) => {
    if (user?.id !== comment.userId) return;
    setEditingPostId(null);
    setEditingPostText("");
    setEditingMessageId(null);
    setEditingMessageText("");
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const saveCommentEdit = async () => {
    if (!user || !editingCommentId) return;
    const text = editingCommentText.trim();
    if (!text) {
      toast.error("Comment cannot be empty");
      return;
    }
    const { error } = await supabase
      .from("social_comments")
      .update({ text })
      .eq("id", editingCommentId)
      .eq("user_id", user.id);
    if (error) return toast.error("Could not update comment");
    setComments((prev) => prev.map((c) => (c.id === editingCommentId ? { ...c, text } : c)));
    cancelEditComment();
    toast.success("Comment updated");
  };

  const toggleLike = async (post: Post) => {
    if (!user) return;
    if (post.liked) {
      setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, likes: Math.max(0, p.likes - 1), liked: false }
            : p,
        ),
      );
      const { error } = await supabase.from("social_post_likes").delete().eq("post_id", post.id).eq("user_id", user.id);
      if (error) {
        setLikedPostIds((prev) => (prev.includes(post.id) ? prev : [...prev, post.id]));
        setPosts((prev) =>
          prev.map((p) =>
            p.id === post.id ? { ...p, likes: p.likes + 1, liked: true } : p,
          ),
        );
        return toast.error("Could not remove like");
      }
      return;
    }
    setLikedPostIds((prev) => (prev.includes(post.id) ? prev : [...prev, post.id]));
    setPosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, likes: p.likes + 1, liked: true } : p)),
    );
    const { error } = await supabase.from("social_post_likes").insert({ post_id: post.id, user_id: user.id });
    if (error && error.code !== "23505") {
      setLikedPostIds((prev) => prev.filter((id) => id !== post.id));
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, likes: Math.max(0, p.likes - 1), liked: false } : p,
        ),
      );
      return toast.error("Could not add like");
    }
  };

  const addComment = async (postId: string) => {
    if (!user) return;
    const text = (commentInputByPost[postId] ?? "").trim();
    if (!text) return;
    const optimisticId = `temp-${crypto.randomUUID()}`;
    setComments((prev) => [...prev, { id: optimisticId, postId, userId: user.id, text }]);
    setCommentInputByPost((prev) => ({ ...prev, [postId]: "" }));
    const { data, error } = await supabase
      .from("social_comments")
      .insert({ post_id: postId, user_id: user.id, text })
      .select("id, post_id, user_id, text")
      .single();
    if (error || !data) {
      setComments((prev) => prev.filter((c) => c.id !== optimisticId));
      setCommentInputByPost((prev) => ({ ...prev, [postId]: text }));
      toast.error("Could not add comment");
      return;
    }
    setComments((prev) => {
      const withoutTemp = prev.filter((c) => c.id !== optimisticId);
      if (withoutTemp.some((c) => c.id === data.id)) return withoutTemp;
      return [...withoutTemp, { id: data.id, postId: data.post_id, userId: data.user_id, text: data.text }];
    });
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "social_comment",
      title: "Comment published",
      body: "Your comment was added to the feed.",
    });
  };

  const deleteComment = async (comment: Comment) => {
    if (!user || comment.userId !== user.id) return;
    const { error } = await supabase.from("social_comments").delete().eq("id", comment.id);
    if (error) return toast.error("Could not delete comment");
    if (editingCommentId === comment.id) cancelEditComment();
    setComments((prev) => prev.filter((c) => c.id !== comment.id));
  };

  const toggleWatchlist = async (streamId: string) => {
    if (!user) return;
    const isSaved = watchlist.includes(streamId);
    if (isSaved) {
      const { error } = await supabase.from("user_watchlist").delete().eq("user_id", user.id).eq("stream_id", streamId);
      if (error) return toast.error("Unable to remove from watchlist");
      setWatchlist((prev) => prev.filter((id) => id !== streamId));
      return;
    }
    const { error } = await supabase.from("user_watchlist").insert({ user_id: user.id, stream_id: streamId });
    if (error && error.code !== "23505") return toast.error("Unable to save to watchlist");
    setWatchlist((prev) => (prev.includes(streamId) ? prev : [...prev, streamId]));
  };

  const addNexosApp = async () => {
    if (!user) return;
    const next = appInput.trim();
    if (!next) return;
    const { data, error } = await supabase
      .from("nexos_apps")
      .insert({ user_id: user.id, name: next })
      .select("id, name")
      .single();
    if (error || !data) return toast.error("Could not add app");
    setApps((prev) => [data, ...prev]);
    setAppInput("");
  };

  const removeNexosApp = async (appId: string) => {
    if (!user) return;
    const { error } = await supabase.from("nexos_apps").delete().eq("id", appId).eq("user_id", user.id);
    if (error) return toast.error("Could not remove app");
    setApps((prev) => prev.filter((a) => a.id !== appId));
  };

  type ShopRow = (typeof shopCatalog)[number];

  const addCatalogToCart = async (catalogItem: ShopRow) => {
    if (!user) return;
    const existing = cart.find((c) => c.id === catalogItem.id);
    const nextQty = (existing?.quantity ?? 0) + 1;
    const { error } = await supabase.from("commerce_cart_items").upsert(
      {
        user_id: user.id,
        product_id: catalogItem.id,
        product_name: catalogItem.name,
        unit_price: catalogItem.price,
        quantity: nextQty,
      },
      { onConflict: "user_id,product_id" },
    );
    if (error) return toast.error("Could not update cart");
    setCart((prev) => {
      const rest = prev.filter((c) => c.id !== catalogItem.id);
      return [...rest, { id: catalogItem.id, name: catalogItem.name, price: catalogItem.price, quantity: nextQty }];
    });
  };

  const setCartLineQuantity = async (productId: string, quantity: number) => {
    if (!user) return;
    const line = cart.find((c) => c.id === productId);
    if (!line) return;
    if (quantity <= 0) {
      const { error } = await supabase
        .from("commerce_cart_items")
        .delete()
        .eq("user_id", user.id)
        .eq("product_id", productId);
      if (error) return toast.error("Could not remove from cart");
      setCart((prev) => prev.filter((c) => c.id !== productId));
      return;
    }
    const { error } = await supabase
      .from("commerce_cart_items")
      .update({ quantity })
      .eq("user_id", user.id)
      .eq("product_id", productId);
    if (error) return toast.error("Could not update cart");
    setCart((prev) => prev.map((c) => (c.id === productId ? { ...c, quantity } : c)));
  };

  const checkoutCart = async () => {
    if (!user || cart.length === 0) return;
    const { data: order, error: orderError } = await supabase
      .from("commerce_orders")
      .insert({ user_id: user.id, total_amount: cartTotal, status: "completed" })
      .select("id, total_amount, status, created_at")
      .single();
    if (orderError || !order) return toast.error("Checkout failed");

    const { error: itemsError } = await supabase.from("commerce_order_items").insert(
      cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        product_name: item.name,
        unit_price: item.price,
        quantity: item.quantity,
      })),
    );
    if (itemsError) return toast.error("Order saved but line items failed");

    const { error: clearCartError } = await supabase.from("commerce_cart_items").delete().eq("user_id", user.id);
    if (clearCartError) toast.error("Order placed but cart could not be cleared in the database");

    const summaryLines = cart.map((item) => `${item.name} x${item.quantity}`);
    const newEntry: OrderSummary = {
      id: order.id,
      total: Number(order.total_amount),
      status: order.status,
      createdAt: new Date(order.created_at).toLocaleDateString(),
      createdAtIso: order.created_at,
      itemSummary: summaryLines.join(", "),
    };
    const nextOrders = [newEntry, ...orders.filter((o) => o.id !== newEntry.id).slice(0, ORDERS_PAGE - 1)];
    setOrders(nextOrders);
    setOldestOrderCursorIso(nextOrders[nextOrders.length - 1]?.createdAtIso ?? null);
    setCart([]);
    toast.success("Checkout completed");
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "commerce",
      title: "Order completed",
      body: `Order #${order.id.slice(0, 8)} processed successfully.`,
    });
  };

  const toggleOrderItems = async (orderId: string) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }
    setExpandedOrderId(orderId);
    if (orderItemsById[orderId]) return;
    const { data, error } = await supabase
      .from("commerce_order_items")
      .select("product_name, quantity")
      .eq("order_id", orderId);
    if (error) {
      toast.error("Failed to load order items");
      return;
    }
    setOrderItemsById((prev) => ({
      ...prev,
      [orderId]: (data ?? []).map((i: { product_name: string; quantity: number }) => `${i.product_name} x${i.quantity}`),
    }));
  };

  const loadMoreOrders = async () => {
    if (!user || !oldestOrderCursorIso || ordersLoadingMore || !ordersHasMore) return;
    setOrdersLoadingMore(true);
    const { data, error } = await supabase
      .from("commerce_orders")
      .select("id, total_amount, status, created_at")
      .eq("user_id", user.id)
      .lt("created_at", oldestOrderCursorIso)
      .order("created_at", { ascending: false })
      .limit(ORDERS_PAGE);
    setOrdersLoadingMore(false);
    if (error) return toast.error("Failed to load older orders");
    const next = data ?? [];
    if (next.length === 0) {
      setOrdersHasMore(false);
      return;
    }
    const newIds = next.map((o: { id: string }) => o.id);
    const itemsRes =
      newIds.length === 0
        ? { data: [] as { order_id: string; product_name: string; quantity: number }[] }
        : await supabase
            .from("commerce_order_items")
            .select("order_id, product_name, quantity")
            .in("order_id", newIds);
    const itemMap = new Map<string, string[]>();
    (itemsRes.data ?? []).forEach((item: { order_id: string; product_name: string; quantity: number }) => {
      const list = itemMap.get(item.order_id) ?? [];
      list.push(`${item.product_name} x${item.quantity}`);
      itemMap.set(item.order_id, list);
    });
    const mapped: OrderSummary[] = next.map((o: { id: string; total_amount: number; status: string; created_at: string }) => ({
      id: o.id,
      total: o.total_amount,
      status: o.status,
      createdAt: new Date(o.created_at).toLocaleDateString(),
      createdAtIso: o.created_at,
      itemSummary: (itemMap.get(o.id) ?? []).join(", ") || "No items",
    }));
    setOrders((prev) => [...prev, ...mapped]);
    setOrdersHasMore(next.length === ORDERS_PAGE);
    setOldestOrderCursorIso(next[next.length - 1].created_at);
  };

  const cancelOrder = async (order: OrderSummary) => {
    if (!user || order.status === "cancelled") return;
    const { error } = await supabase
      .from("commerce_orders")
      .update({ status: "cancelled" })
      .eq("id", order.id)
      .eq("user_id", user.id);
    if (error) return toast.error("Could not cancel order");
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "cancelled" } : o)));
    toast.success("Order marked cancelled");
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "commerce",
      title: "Order cancelled",
      body: `Order #${order.id.slice(0, 8)} was marked cancelled.`,
    });
  };

  const saveScore = async () => {
    if (!user) return;
    if (clicks > highScore) {
      const { error } = await supabase
        .from("gaming_scores")
        .upsert({ user_id: user.id, high_score: clicks }, { onConflict: "user_id" });
      if (error) return toast.error("Failed to save high score");
      setHighScore(clicks);
      toast.success("New high score");
    }
    setClicks(0);
  };

  const deleteNotification = async (id: string) => {
    const { error } = await supabase.from("user_notifications").delete().eq("id", id);
    if (error) return toast.error("Could not delete notification");
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markNotificationRead = async (id: string) => {
    const nowIso = new Date().toISOString();
    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: nowIso })
      .eq("id", id);
    if (!error) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, readAt: nowIso } : n)));
    }
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.readAt);
    if (unread.length === 0) return;
    const nowIso = new Date().toISOString();
    const ids = unread.map((n) => n.id);
    const { error } = await supabase
      .from("user_notifications")
      .update({ read_at: nowIso })
      .in("id", ids);
    if (error) return toast.error("Failed to mark all as read");
    setNotifications((prev) => prev.map((n) => (!n.readAt ? { ...n, readAt: nowIso } : n)));
  };

  const loadMoreMessages = async () => {
    if (!user || !oldestMessageCursor || messagesLoadingMore || !messagesHasMore) return;
    stickChatToBottomRef.current = false;
    setMessagesLoadingMore(true);
    let query = supabase
      .from("chat_messages")
      .select("id, sender, text, created_at, thread_id")
      .eq("user_id", user.id)
      .lt("created_at", oldestMessageCursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (selectedThreadId) query = query.eq("thread_id", selectedThreadId);
    const { data, error } = await query;
    setMessagesLoadingMore(false);
    if (error) return toast.error("Failed to load older messages");
    const next = data ?? [];
    const mapped = next
      .slice()
      .reverse()
      .map((m: { id: string; sender: string; text: string; created_at: string }) => ({
        id: m.id,
        from: m.sender as "me" | "system",
        text: m.text,
        at: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        createdAtIso: m.created_at,
      }));
    setMessages((prev) => [...mapped, ...prev]);
    setMessagesHasMore(next.length === PAGE_SIZE);
    setOldestMessageCursor(next.length > 0 ? next[next.length - 1].created_at : null);
    setShowJumpNewest(true);
  };

  const jumpToNewestMessages = async () => {
    if (!user) return;
    stickChatToBottomRef.current = true;
    let query = supabase
      .from("chat_messages")
      .select("id, sender, text, created_at, thread_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (selectedThreadId) query = query.eq("thread_id", selectedThreadId);
    const { data, error } = await query;
    if (error) return toast.error("Failed to jump to newest messages");
    const next = data ?? [];
    setMessages(
      next
        .slice()
        .reverse()
        .map((m: { id: string; sender: string; text: string; created_at: string }) => ({
          id: m.id,
          from: m.sender as "me" | "system",
          text: m.text,
          at: new Date(m.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
          createdAtIso: m.created_at,
        })),
    );
    setOldestMessageCursor(next.length > 0 ? next[next.length - 1].created_at : null);
    setMessagesHasMore(next.length === PAGE_SIZE);
    setShowJumpNewest(false);
  };

  const loadMoreNotifications = async () => {
    if (!user || !oldestNotificationCursor || notificationsLoadingMore || !notificationsHasMore)
      return;
    setNotificationsLoadingMore(true);
    let query = supabase
      .from("user_notifications")
      .select("id, type, title, body, read_at, created_at")
      .eq("user_id", user.id)
      .lt("created_at", oldestNotificationCursor)
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);
    if (notificationFilter !== "all") {
      query = query.eq("type", notificationFilter);
    }
    const { data, error } = await query;
    setNotificationsLoadingMore(false);
    if (error) return toast.error("Failed to load older notifications");
    const next = (data ?? []).map((n: {
      id: string;
      type: string;
      title: string;
      body: string | null;
      read_at: string | null;
      created_at: string;
    }) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      readAt: n.read_at,
      createdAt: new Date(n.created_at).toLocaleString(),
      createdAtIso: n.created_at,
    }));
    setNotifications((prev) => [...prev, ...next]);
    setNotificationsHasMore((data ?? []).length === PAGE_SIZE);
    setOldestNotificationCursor(
      (data ?? []).length > 0 ? (data ?? [])[data!.length - 1].created_at : null,
    );
  };

  const runIntent = () => {
    const raw = intentInput.trim();
    const query = raw.toLowerCase();
    if (!query) return;
    if (
      query.includes("buy") ||
      query.includes("shop") ||
      query.includes("checkout") ||
      query.includes("subscription") ||
      query.includes("tier") ||
      query.includes("plan")
    ) {
      setAiResponse("Best pillar: Commerce. Compare add-ons, checkout, and blueprint §05 tier previews.");
      setActiveTab("commerce");
      return;
    }
    if (
      query.includes("watch") ||
      query.includes("movie") ||
      query.includes("series") ||
      query.includes("stream") ||
      query.includes("trailer") ||
      query.includes("episode")
    ) {
      setAiResponse("Best pillar: Streaming. Opening your media library and watchlist.");
      setActiveTab("streaming");
      return;
    }
    if (query.includes("chat") || query.includes("message")) {
      setAiResponse("Best pillar: Chat. Opening secure messaging.");
      setActiveTab("chat");
      return;
    }
    const searchMatch = raw.match(/\b(?:search|find)\s+(.+)/i);
    if (searchMatch?.[1]) {
      setSocialSearch(searchMatch[1].trim());
      setAiResponse("Best pillar: Social. Applied a feed search from your intent.");
      setActiveTab("social");
      return;
    }
    if (query.includes("search") || query.includes("find")) {
      setAiResponse("Best pillar: Social. Use the feed search box, or try: search your keywords.");
      setActiveTab("social");
      return;
    }
    if (query.includes("post") || query.includes("social") || query.includes("feed") || query.includes("comment")) {
      setAiResponse("Best pillar: Social. Let's publish to your feed.");
      setActiveTab("social");
      return;
    }
    if (query.includes("alert") || query.includes("notif") || query.includes("bell")) {
      setAiResponse("Best pillar: Alerts. Opening your notification center.");
      setActiveTab("notifications");
      return;
    }
    if (
      query.includes("profile") ||
      query.includes("settings") ||
      query.includes("account") ||
      query.includes("bio") ||
      query.includes("handle")
    ) {
      setAiResponse("Best pillar: Settings. You can edit identity here or on the Profile page in the header.");
      setActiveTab("settings");
      return;
    }
    if (
      query.includes("blueprint") ||
      query.includes("roadmap") ||
      query.includes("pillar") ||
      query.includes("zero-trust") ||
      query.includes("advertising tier")
    ) {
      setAiResponse("Opening the 2026 blueprint coverage matrix (PDF outline cross-check).");
      setActiveTab("blueprint");
      return;
    }
    if (query.includes("game") || query.includes("play")) {
      setAiResponse("Best pillar: Gaming. Launching instant game mode.");
      setActiveTab("gaming");
      return;
    }
    setAiResponse("Best pillar: NexOS. I'll route this to your app ecosystem for custom workflows.");
    setActiveTab("nexos");
  };

  return (
    <div className="mt-12 space-y-6">
      <div className="rounded-2xl border border-border bg-surface/70 p-5">
        <p className="text-xs font-mono-display uppercase tracking-widest text-primary">Workspace</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">Run your pillars, {name}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          This MVP implements functional modules for the super-app blueprint. Open the{" "}
          <button
            type="button"
            onClick={() => setActiveTab("blueprint")}
            className="text-primary underline-offset-2 hover:underline"
          >
            Blueprint
          </button>{" "}
          tab to compare against your 2026 PDF outline.
        </p>
        {booting && <p className="mt-2 text-xs text-muted-foreground">Syncing modules from Supabase…</p>}
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5">
        {pillarTabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl border px-3 py-3 text-sm transition-colors ${
                active
                  ? "border-primary bg-primary/15 text-foreground"
                  : "border-border bg-surface/50 text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="mx-auto mb-1 h-5 w-5">
                <Icon className="h-5 w-5" />
              </div>
              {tab.label}
              {tab.id === "notifications" && unreadNotificationCount > 0 && (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {unreadNotificationCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl border border-border bg-surface/60 p-5">
        {tabLoading[activeTab] ? (
          <div className="space-y-3">
            <div className="h-5 w-44 animate-pulse rounded bg-muted" />
            <div className="h-4 w-full animate-pulse rounded bg-muted" />
            <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-24 w-full animate-pulse rounded bg-muted" />
          </div>
        ) : (
          <>
        {activeTab === "chat" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Secure Chat</h3>
            <p className="text-sm text-muted-foreground">
              Native messaging pillar with threaded history, pins, read markers, and delete-own-message (blueprint
              chat + backend §08). E2E encryption is not simulated here.
            </p>
            <div className="space-y-2 rounded-md border border-border bg-background/50 p-3">
              <div className="flex gap-2">
                <input
                  value={newThreadTitle}
                  onChange={(e) => setNewThreadTitle(e.target.value)}
                  placeholder="New conversation title"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <button onClick={createThread} className="rounded-md border border-border px-3 py-2 text-sm">
                  Create
                </button>
              </div>
              <div className="flex max-h-48 flex-col gap-1.5 overflow-y-auto pr-1">
                {threads.map((t) => {
                  const active = selectedThreadId === t.id;
                  return (
                    <div
                      key={t.id}
                      className={`flex min-w-0 items-stretch gap-1 rounded-lg border px-2 py-1.5 text-xs ${
                        active ? "border-primary bg-primary/10" : "border-border bg-background/40"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedThreadId(t.id);
                          markThreadRead(t.id);
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-medium text-foreground">
                            {t.isPinned ? "📌 " : ""}
                            {t.title}
                            {t.unreadCount > 0 && (
                              <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground align-middle">
                                {t.unreadCount}
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 text-[10px] text-muted-foreground tabular-nums">
                            {toRelativeTime(t.lastMessageAtIso)}
                          </span>
                        </div>
                        <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                          {t.lastMessageSender === "me" ? "You" : "Relay"} · {t.lastMessagePreview}
                        </p>
                      </button>
                      <div className="flex shrink-0 flex-col justify-center gap-0.5 border-l border-border pl-1">
                        <button
                          type="button"
                          onClick={() => togglePinThread(t)}
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] leading-tight"
                        >
                          {t.isPinned ? "Unpin" : "Pin"}
                        </button>
                        <button
                          type="button"
                          onClick={() => startRenameThread(t)}
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] leading-tight"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteThread(t.id)}
                          className="rounded border border-border px-1.5 py-0.5 text-[10px] leading-tight"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedThread && (
                <div className="text-xs text-muted-foreground">
                  <p className="truncate">{selectedThread.lastMessagePreview}</p>
                  <p className="mt-1">
                    {selectedThread.lastMessageSender === "me" ? "You" : "Relay"} ·{" "}
                    {toRelativeTime(selectedThread.lastMessageAtIso)}
                  </p>
                </div>
              )}
              {renameThreadId && (
                <div className="flex gap-2">
                  <input
                    value={renameThreadValue}
                    onChange={(e) => setRenameThreadValue(e.target.value)}
                    placeholder="Rename conversation"
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <button onClick={saveRenameThread} className="rounded-md border border-border px-3 py-2 text-sm">
                    Save
                  </button>
                </div>
              )}
            </div>
            <div
              ref={chatScrollRef}
              onScroll={updateChatStickFromScroll}
              className="space-y-2 max-h-56 overflow-y-auto overflow-x-hidden pr-1"
            >
              {messages.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    m.from === "me" ? "border-primary/30 bg-primary/10" : "border-border bg-background/60"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 font-medium text-xs uppercase tracking-widest text-muted-foreground">
                    <span>
                      {m.from === "me" ? "You" : "Relay"} · {m.at}
                    </span>
                    {m.from === "me" && editingMessageId !== m.id && (
                      <span className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => beginEditMessage(m)}
                          className="normal-case rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deleteOwnMessage(m)}
                          className="normal-case rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Delete
                        </button>
                      </span>
                    )}
                  </div>
                  {editingMessageId === m.id ? (
                    <div className="mt-2 space-y-2">
                      <textarea
                        value={editingMessageText}
                        onChange={(e) => setEditingMessageText(e.target.value)}
                        rows={3}
                        maxLength={2000}
                        className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void saveMessageEdit()}
                          className="rounded-md bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={cancelEditMessage}
                          className="rounded-md border border-border px-2 py-1 text-[11px]"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1">{m.text}</p>
                  )}
                </div>
              ))}
            </div>
            {messagesHasMore && (
              <div className="flex gap-2">
                <button
                  onClick={loadMoreMessages}
                  disabled={messagesLoadingMore}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
                >
                  {messagesLoadingMore ? "Loading…" : "Load older messages"}
                </button>
                {showJumpNewest && (
                  <button
                    onClick={jumpToNewestMessages}
                    className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                  >
                    Jump to newest
                  </button>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submitChat();
                  }
                }}
                placeholder="Type a message..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void submitChat()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === "commerce" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commerce</h3>
            <p className="text-sm text-muted-foreground">
              Checkout and catalog align with blueprint pillars for native commerce. Subscription and ad tiers (§05)
              are previewed below; billing integration is not wired yet.
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              {shopCatalog.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">${item.price}/mo</p>
                  <button
                    type="button"
                    onClick={() => void addCatalogToCart(item)}
                    className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
                  >
                    Add to cart
                  </button>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold tracking-tight">Plans & tiers (blueprint §05)</h4>
              <div className="grid gap-3 md:grid-cols-3">
                {SUBSCRIPTION_TIER_CARDS.map((tier) => (
                  <div
                    key={tier.id}
                    className="rounded-lg border border-border bg-background/50 p-3 text-sm shadow-sm"
                  >
                    <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground">
                      {tier.blueprintRef}
                    </p>
                    <p className="mt-1 text-lg font-semibold">{tier.name}</p>
                    <p className="text-primary font-medium">{tier.priceLabel}</p>
                    <p className="mt-2 text-muted-foreground">{tier.blurb}</p>
                    <ul className="mt-2 list-inside list-disc space-y-0.5 text-xs text-muted-foreground">
                      {tier.features.map((f) => (
                        <li key={f}>{f}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Privacy-first advertising engine (§04) stays on the roadmap until consent, inventory, and
                measurement APIs are defined.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted-foreground">
                Cart: {cart.length} line{cart.length === 1 ? "" : "s"} · {cartUnits} unit{cartUnits === 1 ? "" : "s"}
              </p>
              {cart.length > 0 && (
                <ul className="mt-2 space-y-2 text-sm">
                  {cart.map((line) => (
                    <li
                      key={line.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/80 bg-background/40 px-2 py-1.5"
                    >
                      <span className="font-medium">
                        {line.name}{" "}
                        <span className="font-normal text-muted-foreground">
                          (${line.price} × {line.quantity})
                        </span>
                      </span>
                      <span className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => void setCartLineQuantity(line.id, line.quantity - 1)}
                          className="rounded border border-border px-2 py-0.5 text-xs"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center tabular-nums">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => void setCartLineQuantity(line.id, line.quantity + 1)}
                          className="rounded border border-border px-2 py-0.5 text-xs"
                        >
                          +
                        </button>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 font-semibold">Total: ${cartTotal}</p>
              <button
                type="button"
                onClick={() => void checkoutCart()}
                className="mt-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                disabled={!cart.length}
              >
                Checkout
              </button>
              <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                <p className="uppercase tracking-widest">Recent orders</p>
                {orders.length === 0 ? (
                  <p>No purchases yet</p>
                ) : (
                  orders.map((o) => (
                    <div key={o.id} className="flex flex-wrap items-baseline justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleOrderItems(o.id)}
                        className="text-left hover:text-foreground"
                      >
                        #{o.id.slice(0, 8)} · ${o.total} ·{" "}
                        <span
                          className={
                            o.status === "cancelled"
                              ? "text-muted-foreground line-through"
                              : o.status === "pending"
                                ? "text-amber-600 dark:text-amber-400"
                                : ""
                          }
                        >
                          {o.status}
                        </span>{" "}
                        · {o.createdAt}
                      </button>
                      {o.status !== "cancelled" && (
                        <button
                          type="button"
                          onClick={() => void cancelOrder(o)}
                          className="rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          Cancel order
                        </button>
                      )}
                      {expandedOrderId === o.id && (
                        <div className="basis-full mt-1 pl-2 text-[11px]">
                          {(orderItemsById[o.id] ?? [o.itemSummary]).map((item) => (
                            <p key={`${o.id}-${item}`}>- {item}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
                {ordersHasMore && (
                  <button
                    type="button"
                    onClick={() => void loadMoreOrders()}
                    disabled={ordersLoadingMore}
                    className="mt-2 rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
                  >
                    {ordersLoadingMore ? "Loading…" : "Load older orders"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Feed</h3>
            <input
              value={socialSearch}
              onChange={(e) => setSocialSearch(e.target.value)}
              placeholder="Search posts…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <div className="flex gap-2">
              <input
                value={postInput}
                onChange={(e) => setPostInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void publishPost();
                  }
                }}
                placeholder="Share an update..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void publishPost()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Post
              </button>
            </div>
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <article key={post.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    {editingPostId === post.id ? (
                      <div className="min-w-0 flex-1 space-y-2">
                        <textarea
                          value={editingPostText}
                          onChange={(e) => setEditingPostText(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void savePostEdit()}
                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditPost}
                            className="rounded-md border border-border px-3 py-1.5 text-xs"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="flex-1">{post.text}</p>
                    )}
                    {user?.id === post.userId && editingPostId !== post.id && (
                      <div className="flex shrink-0 flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => beginEditPost(post)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => void deletePost(post)}
                          className="rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => void toggleLike(post)}
                    className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {post.liked ? "Unlike" : "Like"} · {post.likes}
                  </button>
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {comments
                      .filter((c) => c.postId === post.id)
                      .map((comment) => (
                        <div
                          key={comment.id}
                          className="rounded-md border border-border/60 bg-background/40 px-2 py-1.5 text-sm text-muted-foreground"
                        >
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <textarea
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                rows={2}
                                maxLength={280}
                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                              />
                              <div className="flex flex-wrap gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => void saveCommentEdit()}
                                  className="rounded border border-border bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditComment}
                                  className="rounded border border-border px-2 py-0.5 text-[11px]"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-2">
                              <p>
                                <span className="font-medium text-foreground/90">
                                  {user?.id === comment.userId ? "You" : "Member"}
                                </span>
                                : {comment.text}
                              </p>
                              {user?.id === comment.userId && (
                                <span className="flex shrink-0 flex-col gap-0.5">
                                  <button
                                    type="button"
                                    onClick={() => beginEditComment(comment)}
                                    className="rounded border border-border px-2 py-0.5 text-[11px] hover:text-foreground"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => void deleteComment(comment)}
                                    className="rounded border border-border px-2 py-0.5 text-[11px] hover:text-foreground"
                                  >
                                    Remove
                                  </button>
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    <div className="flex gap-2">
                      <input
                        value={commentInputByPost[post.id] ?? ""}
                        onChange={(e) =>
                          setCommentInputByPost((prev) => ({
                            ...prev,
                            [post.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            void addComment(post.id);
                          }
                        }}
                        placeholder="Add a comment..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => void addComment(post.id)}
                        className="rounded-md border border-border px-3 py-2 text-sm"
                      >
                        Comment
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {activeTab === "streaming" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Streaming Hub</h3>
            <p className="text-sm text-muted-foreground">
              Long-form and cinema-style playback (blueprint §07). Sample MP4s are public test assets so you can
              verify the player; source URLs are shown under the player.
            </p>
            <input
              value={streamSearch}
              onChange={(e) => setStreamSearch(e.target.value)}
              placeholder="Filter by title…"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            {watchlist.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">My watchlist</p>
                <div className="flex flex-wrap gap-2">
                  {watchlist.map((id) => {
                    const meta = streamLibrary.find((s) => s.id === id);
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setStreamFilter("All");
                          setStreamSearch("");
                          setPlaybackStreamId(id);
                        }}
                        className="rounded-full border border-border bg-background/80 px-3 py-1 text-xs hover:border-primary hover:text-foreground"
                      >
                        {meta?.title ?? id}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              {(["All", "Cinema", "Series", "Docs"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStreamFilter(f)}
                  className={`rounded-md border px-3 py-1.5 text-sm ${
                    streamFilter === f ? "border-primary bg-primary/15" : "border-border"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            {playbackStream && (
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const current = filteredStreams.findIndex((item) => item.id === playbackStream.id);
                    const next = filteredStreams[(current + 1) % filteredStreams.length];
                    setPlaybackStreamId(next?.id ?? playbackStream.id);
                  }}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  Play next
                </button>
                <button
                  type="button"
                  onClick={() => void toggleWatchlist(playbackStream.id)}
                  className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                >
                  {watchlist.includes(playbackStream.id) ? "Remove from watchlist" : "Save current title"}
                </button>
              </div>
            )}
            {playbackStream && (
              <div className="overflow-hidden rounded-xl border border-border bg-black shadow-card-elevated">
                <VideoPlayer
                  key={playbackStream.id}
                  className="aspect-video max-h-[min(420px,70vh)] w-full object-contain"
                  poster={playbackStream.poster}
                  sources={playbackStream.videoSources}
                  controls
                  preload="metadata"
                />
                <div className="space-y-1 border-t border-border bg-background/95 p-3">
                  <p className="text-sm font-medium text-foreground">
                    Now playing: {playbackStream.title}{" "}
                    <span className="font-normal text-muted-foreground">
                      ({playbackStream.category} · {playbackStream.duration})
                    </span>
                  </p>
                  <p className="text-sm text-muted-foreground">{playbackStream.description}</p>
                  <p className="break-all font-mono text-[11px] text-muted-foreground">
                    {playbackStream.videoSources.join(" | ")}
                  </p>
                </div>
              </div>
            )}
            {filteredStreams.length === 0 && (
              <div className="rounded-lg border border-dashed border-border bg-background/40 p-6 text-sm text-muted-foreground">
                No stream matches that filter yet. Try a different title or reset the category.
              </div>
            )}
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredStreams.map((item) => {
                const isSaved = watchlist.includes(item.id);
                const isPlaying = playbackStreamId === item.id;
                return (
                  <div
                    key={item.id}
                    className={`rounded-lg border bg-background/60 p-3 ${
                      isPlaying ? "border-primary ring-1 ring-primary/40" : "border-border"
                    }`}
                  >
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category} · {item.duration}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
                    <p className="mt-2 line-clamp-2 break-all font-mono text-[10px] text-muted-foreground">
                      {item.videoSources[0]}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setPlaybackStreamId(item.id)}
                        className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
                      >
                        Play in player
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleWatchlist(item.id)}
                        className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        {isSaved ? "Remove from watchlist" : "Save to watchlist"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "gaming" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Gaming</h3>
            <p className="text-sm text-muted-foreground">Tap challenge: beat your personal best score.</p>
            <div className="rounded-lg border border-border bg-background/60 p-4">
              <p>Current score: {clicks}</p>
              <p>High score: {highScore}</p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => setClicks((v) => v + 1)}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                >
                  Tap
                </button>
                <button
                  onClick={saveScore}
                  className="rounded-md border border-border px-4 py-2 text-sm"
                >
                  Save & reset
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "nexos" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">NexOS App Ecosystem</h3>
            <p className="text-sm text-muted-foreground">
              Blueprint §03 — composable mini-apps inside your private NEXUS workspace. Each app is a row in
              Supabase with realtime sync across sessions.
            </p>
            <div className="flex gap-2">
              <input
                value={appInput}
                onChange={(e) => setAppInput(e.target.value)}
                placeholder="Add custom mini-app name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void addNexosApp()}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Add
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {apps.map((app) => (
                <div key={app.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium">{app.name}</p>
                    <button
                      type="button"
                      onClick={() => void removeNexosApp(app.id)}
                      className="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      Remove
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">Composable app in your private workspace.</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ai" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">AI Twin Router</h3>
            <p className="text-sm text-muted-foreground">
              Intent-first assistant (blueprint key theme) that routes actions to the right NEXUS pillar. Hosted LLM
              calls are not enabled here; this router is deterministic. Your briefing is stored only in this browser.
            </p>
            <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
              <label className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground">
                Twin briefing (local only)
              </label>
              <textarea
                value={twinBriefing}
                onChange={(e) => setTwinBriefing(e.target.value)}
                placeholder="How should your twin sound? What guardrails or goals matter?"
                rows={4}
                maxLength={2000}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem(AI_TWIN_BRIEFING_STORAGE_KEY, twinBriefing);
                    toast.success("Twin briefing saved in this browser");
                  } catch {
                    toast.error("Could not save briefing");
                  }
                }}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface"
              >
                Save briefing
              </button>
            </div>
            <div className="flex gap-2">
              <input
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    runIntent();
                  }
                }}
                placeholder="e.g. watch a movie · blueprint roadmap · search neon · open alerts"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={runIntent}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Route
              </button>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3 text-sm">{aiResponse}</div>
          </div>
        )}

        {activeTab === "blueprint" && (
          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold">Blueprint coverage (2026 edition)</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Cross-checked against your PDF outline. The file on disk is a one-page summary TOC; detailed
                narrative sections may live elsewhere. This matrix tracks what the web MVP implements today.
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-muted-foreground">{BLUEPRINT_SOURCE}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Local path (for your review):{" "}
                <span className="break-all">
                  file:///c:/Users/LENOVO/Downloads/NEXUS_Super_App_Blueprint_2026.pdf
                </span>
              </p>
            </div>
            <div className="rounded-lg border border-border bg-background/50 p-4">
              <p className="text-xs font-mono-display uppercase tracking-widest text-primary">Key themes</p>
              <ul className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                {BLUEPRINT_KEY_THEMES.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="text-primary">·</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono-display uppercase tracking-widest text-muted-foreground">
                Sections 01–13
              </p>
              <div className="grid gap-2 md:grid-cols-2">
                {BLUEPRINT_SECTIONS.map((row) => (
                  <div
                    key={row.id}
                    className={`rounded-lg border p-3 text-sm ${
                      row.coverage === "mvp"
                        ? "border-emerald-500/35 bg-emerald-500/[0.06]"
                        : row.coverage === "partial"
                          ? "border-amber-500/35 bg-amber-500/[0.06]"
                          : "border-border bg-muted/15"
                    }`}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-mono text-xs text-muted-foreground">{row.id}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                          row.coverage === "mvp"
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                            : row.coverage === "partial"
                              ? "bg-amber-500/20 text-amber-800 dark:text-amber-200"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {row.coverage}
                      </span>
                    </div>
                    <p className="mt-1 font-medium text-foreground">{row.title}</p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{row.detail}</p>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Mobile native shells (§06), multi-region active-active (§11), and the full advertising engine (§04) are
              explicitly out of scope for this repository until product attaches specs and APIs.
            </p>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Settings</h3>
            <p className="text-sm text-muted-foreground rounded-lg border border-border bg-background/40 p-3">
              <span className="font-medium text-foreground">Security (blueprint §12):</span> You are on
              password- or OAuth-backed Supabase Auth with row-level security on user data. Device posture,
              continuous verification, and org-wide SSO are roadmap items once requirements land.
            </p>
            <p className="text-sm text-muted-foreground">
              A dedicated profile page is available from the header. Edits here use the same form.
            </p>
            <ProfileSettingsForm />
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Notification Center</h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  Unread: {unreadNotificationCount}
                </span>
                <button
                  onClick={markAllNotificationsRead}
                  className="rounded-md border border-border px-2 py-1 text-xs"
                >
                  Mark all read
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "All"],
                  ["chat", "Chat"],
                  ["social_comment", "Comments"],
                  ["commerce", "Commerce"],
                  ["profile", "Profile"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setNotificationFilter(id)}
                  className={`rounded-md border px-3 py-1.5 text-xs ${
                    notificationFilter === id
                      ? "border-primary bg-primary/15"
                      : "border-border"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {filteredNotifications.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
              ) : (
                filteredNotifications.map((n) => (
                  <div key={n.id} className="rounded-lg border border-border bg-background/60 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{n.title}</p>
                        {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                        <p className="mt-1 text-[11px] text-muted-foreground">{n.createdAt}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        {!n.readAt && (
                          <button
                            type="button"
                            onClick={() => void markNotificationRead(n.id)}
                            className="rounded-md border border-border px-2 py-1 text-xs"
                          >
                            Mark read
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => void deleteNotification(n.id)}
                          className="rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {notificationsHasMore && (
              <button
                onClick={loadMoreNotifications}
                disabled={notificationsLoadingMore}
                className="rounded-md border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-60"
              >
                {notificationsLoadingMore ? "Loading…" : "Load older notifications"}
              </button>
            )}
          </div>
        )}
          </>
        )}
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Link
          to="/app/profile"
          className="block rounded-xl border border-border bg-surface/60 p-4 transition-colors hover:border-primary/40 hover:bg-surface"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Identity</p>
          <p className="mt-1 text-xl font-semibold">{name}</p>
          <p className="mt-2 text-xs text-muted-foreground">Open profile →</p>
        </Link>
        <button
          type="button"
          onClick={() => setActiveTab("nexos")}
          className="rounded-xl border border-border bg-surface/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Apps launched</p>
          <p className="mt-1 text-xl font-semibold">{apps.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">Open NexOS →</p>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("streaming")}
          className="rounded-xl border border-border bg-surface/60 p-4 text-left transition-colors hover:border-primary/40 hover:bg-surface"
        >
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Watchlist</p>
          <p className="mt-1 text-xl font-semibold">{watchlist.length}</p>
          <p className="mt-2 text-xs text-muted-foreground">Open streaming →</p>
        </button>
      </div>

      <div className="rounded-lg border border-border bg-surface/40 p-4 text-sm text-muted-foreground">
        <Globe className="mr-2 inline-block h-4 w-4" />
        Multi-region backend, privacy-first advertising, and full zero-trust rollout remain roadmap items (see
        Blueprint §04, §11–12).{" "}
        <button type="button" onClick={() => setActiveTab("blueprint")} className="text-primary hover:underline">
          Coverage matrix
        </button>
      </div>
    </div>
  );
}
