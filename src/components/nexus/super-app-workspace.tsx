import { useEffect, useMemo, useState } from "react";
import { MessageSquare, ShoppingBag, Sparkles, Tv, Globe, Gamepad2, Cpu, Bot, Settings, Bell } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

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
  lastMessageAtLabel: string;
  lastMessageSender: "me" | "system" | null;
  unreadCount: number;
};
type Post = { id: string; text: string; likes: number; liked: boolean };
type CartItem = { id: string; name: string; price: number };
type OrderSummary = { id: string; total: number; status: string; createdAt: string; itemSummary: string };
type Comment = { id: string; postId: string; text: string };
type StreamItem = { id: string; title: string; category: "Cinema" | "Series" | "Docs"; duration: string };
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

const streamLibrary: StreamItem[] = [
  { id: "strm-01", title: "Neon District", category: "Cinema", duration: "2h 04m" },
  { id: "strm-02", title: "Signal City", category: "Series", duration: "8 eps" },
  { id: "strm-03", title: "Built at Scale", category: "Docs", duration: "58m" },
  { id: "strm-04", title: "Aurora Protocol", category: "Cinema", duration: "1h 49m" },
];

const pillarTabs = [
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "commerce", label: "Commerce", icon: ShoppingBag },
  { id: "social", label: "Social", icon: Sparkles },
  { id: "streaming", label: "Streaming", icon: Tv },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
  { id: "nexos", label: "NexOS", icon: Cpu },
  { id: "ai", label: "AI Twin", icon: Bot },
  { id: "notifications", label: "Alerts", icon: Bell },
  { id: "settings", label: "Settings", icon: Settings },
] as const;

type PillarTab = (typeof pillarTabs)[number]["id"];

export function SuperAppWorkspace({ name }: { name: string }) {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<PillarTab>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesHasMore, setMessagesHasMore] = useState(false);
  const [messagesLoadingMore, setMessagesLoadingMore] = useState(false);
  const [oldestMessageCursor, setOldestMessageCursor] = useState<string | null>(null);
  const [showJumpNewest, setShowJumpNewest] = useState(false);
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
  const [chatInput, setChatInput] = useState("");
  const [postInput, setPostInput] = useState("");
  const [appInput, setAppInput] = useState("");
  const [intentInput, setIntentInput] = useState("");
  const [displayNameInput, setDisplayNameInput] = useState("");
  const [handleInput, setHandleInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [clicks, setClicks] = useState(0);
  const [aiResponse, setAiResponse] = useState(
    "Tell your AI Twin what you want to do and it will route you to the right pillar.",
  );

  const filteredStreams = useMemo(
    () => streamLibrary.filter((s) => streamFilter === "All" || s.category === streamFilter),
    [streamFilter],
  );
  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price, 0), [cart]);
  const unreadNotificationCount = useMemo(
    () => notifications.filter((n) => !n.readAt).length,
    [notifications],
  );
  const filteredNotifications = useMemo(() => {
    if (notificationFilter === "all") return notifications;
    return notifications.filter((n) => n.type === notificationFilter);
  }, [notifications, notificationFilter]);

  useEffect(() => {
    setDisplayNameInput(profile?.display_name ?? "");
    setHandleInput(profile?.handle ?? "");
    setBioInput(profile?.bio ?? "");
  }, [profile]);

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

      const [threadsRes, threadReadsRes, threadMessagesRes, messagesRes, postsRes, likesRes, watchlistRes, appsRes, scoreRes, ordersRes, notificationsRes] = await Promise.all([
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
        supabase.from("commerce_orders").select("id, total_amount, status, created_at").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase
          .from("user_notifications")
          .select("id, type, title, body, read_at, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(PAGE_SIZE),
      ]);

      if (!active) return;
      if (threadsRes.error || threadReadsRes.error || threadMessagesRes.error || messagesRes.error || postsRes.error || likesRes.error || watchlistRes.error || appsRes.error || scoreRes.error || ordersRes.error || notificationsRes.error) {
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
          lastMessageAtLabel: toRelativeTime(latestMessageAtMap.get(t.id) ?? null),
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
        (postsRes.data ?? []).map((p: { id: string; text: string; likes_count: number }) => ({
          id: p.id,
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
              .select("id, post_id, text, created_at")
              .in("post_id", postIds)
              .order("created_at", { ascending: true });
      setComments(
        (commentsRes.data ?? []).map((c: { id: string; post_id: string; text: string }) => ({
          id: c.id,
          postId: c.post_id,
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

      setOrders(
        (ordersRes.data ?? []).map((o: { id: string; total_amount: number; status: string; created_at: string }) => ({
          id: o.id,
          total: o.total_amount,
          status: o.status,
          createdAt: new Date(o.created_at).toLocaleDateString(),
          itemSummary: (itemMap.get(o.id) ?? []).join(", ") || "No items",
        })),
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
    if (!user) return;
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
          if (selectedThreadId && row.thread_id !== selectedThreadId) return;
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
                    lastMessageAtLabel: toRelativeTime(row.created_at),
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
        (payload: RealtimePayload<{ id: string; text: string; likes_count: number }>) => {
          const row = payload.new as { id: string; text: string; likes_count: number };
          setPosts((prev) => (prev.some((p) => p.id === row.id) ? prev : [{ id: row.id, text: row.text, likes: row.likes_count, liked: false }, ...prev]));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_comments" },
        (payload: RealtimePayload<{ id: string; post_id: string; text: string }>) => {
          const row = payload.new as { id: string; post_id: string; text: string };
          setComments((prev) =>
            prev.some((c) => c.id === row.id)
              ? prev
              : [...prev, { id: row.id, postId: row.post_id, text: row.text }],
          );
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "social_post_likes" },
        (payload: RealtimePayload<{ post_id: string; user_id: string }>) => {
          const row = payload.new as { post_id: string; user_id: string };
          setPosts((prev) => prev.map((p) => (p.id === row.post_id ? { ...p, likes: p.likes + 1 } : p)));
          if (row.user_id === user.id) {
            setLikedPostIds((prev) => (prev.includes(row.post_id) ? prev : [...prev, row.post_id]));
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "social_post_likes" },
        (payload: RealtimePayload<{ post_id: string; user_id: string }>) => {
          const row = payload.new as { post_id: string; user_id: string };
          setPosts((prev) => prev.map((p) => (p.id === row.post_id ? { ...p, likes: Math.max(0, p.likes - 1) } : p)));
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
        (payload: RealtimePayload<{ stream_id: string }>) => {
          const row = payload.new as { stream_id: string };
          setWatchlist((prev) => prev.filter((id) => id !== row.stream_id));
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
        lastMessageAtLabel: "No activity",
        lastMessageSender: null,
        unreadCount: 0,
      },
    ]);
    setSelectedThreadId(data.id);
    setMessages([]);
    setNewThreadTitle("");
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
    setThreads((prev) => prev.filter((t) => t.id !== threadId));
    if (selectedThreadId === threadId) {
      const next = threads.find((t) => t.id !== threadId);
      setSelectedThreadId(next?.id ?? null);
      setMessages([]);
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
    setPosts((prev) => [{ id: data.id, text: data.text, likes: data.likes_count, liked: false }, ...prev]);
    setPostInput("");
    toast.success("Post published");
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
    setComments((prev) => [...prev, { id: optimisticId, postId, text }]);
    setCommentInputByPost((prev) => ({ ...prev, [postId]: "" }));
    const { data, error } = await supabase
      .from("social_comments")
      .insert({ post_id: postId, user_id: user.id, text })
      .select("id, post_id, text")
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
      return [...withoutTemp, { id: data.id, postId: data.post_id, text: data.text }];
    });
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "social_comment",
      title: "Comment published",
      body: "Your comment was added to the feed.",
    });
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
        quantity: 1,
      })),
    );
    if (itemsError) return toast.error("Order saved but line items failed");

    setOrders((prev) => [
      {
        id: order.id,
        total: Number(order.total_amount),
        status: order.status,
        createdAt: new Date(order.created_at).toLocaleDateString(),
        itemSummary: cart.map((item) => `${item.name} x1`).join(", "),
      },
      ...prev.slice(0, 4),
    ]);
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

  const saveProfile = async () => {
    if (!user) return;
    const nextHandle = handleInput.trim().replace(/^@/, "") || null;
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayNameInput.trim() || null,
        handle: nextHandle,
        bio: bioInput.trim() || null,
      })
      .eq("id", user.id);
    if (error) {
      toast.error("Profile update failed");
      return;
    }
    await refreshProfile();
    toast.success("Profile updated");
    await supabase.from("user_notifications").insert({
      user_id: user.id,
      type: "profile",
      title: "Profile updated",
      body: "Your identity settings were saved.",
    });
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
    const query = intentInput.toLowerCase();
    if (!query.trim()) return;
    if (query.includes("buy") || query.includes("shop") || query.includes("checkout")) {
      setAiResponse("Best pillar: Commerce. I can help you compare products and check out.");
      setActiveTab("commerce");
      return;
    }
    if (query.includes("watch") || query.includes("movie") || query.includes("series")) {
      setAiResponse("Best pillar: Streaming. Opening your media library and watchlist.");
      setActiveTab("streaming");
      return;
    }
    if (query.includes("chat") || query.includes("message")) {
      setAiResponse("Best pillar: Chat. Opening secure messaging.");
      setActiveTab("chat");
      return;
    }
    if (query.includes("post") || query.includes("social") || query.includes("feed")) {
      setAiResponse("Best pillar: Social. Let's publish to your feed.");
      setActiveTab("social");
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
          This MVP implements functional modules for the super-app blueprint.
        </p>
        {booting && <p className="mt-2 text-xs text-muted-foreground">Syncing modules from Supabase…</p>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
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
              <div className="flex flex-wrap gap-2">
                {threads.map((t) => (
                  <div key={t.id} className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedThreadId(t.id);
                        markThreadRead(t.id);
                      }}
                      className={`rounded-md border px-3 py-1.5 text-xs ${
                        selectedThreadId === t.id ? "border-primary bg-primary/15" : "border-border"
                      }`}
                    >
                      {t.isPinned ? "📌 " : ""}
                      {t.title}
                      {t.unreadCount > 0 && (
                        <span className="ml-1 inline-flex min-w-4 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                          {t.unreadCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => togglePinThread(t)}
                      className="rounded-md border border-border px-2 py-1 text-[10px]"
                    >
                      {t.isPinned ? "Unpin" : "Pin"}
                    </button>
                    <button
                      onClick={() => startRenameThread(t)}
                      className="rounded-md border border-border px-2 py-1 text-[10px]"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteThread(t.id)}
                      className="rounded-md border border-border px-2 py-1 text-[10px]"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
              {selectedThreadId && (
                <div className="text-xs text-muted-foreground">
                  <p>{threads.find((t) => t.id === selectedThreadId)?.lastMessagePreview}</p>
                  <p className="mt-1">
                    {threads.find((t) => t.id === selectedThreadId)?.lastMessageSender === "me"
                      ? "You"
                      : "Relay"}{" "}
                    · {threads.find((t) => t.id === selectedThreadId)?.lastMessageAtLabel}
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
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {messages.map((m, i) => (
                <div
                  key={`${m.id}-${i}`}
                  className={`rounded-lg border px-3 py-2 text-sm ${
                    m.from === "me" ? "border-primary/30 bg-primary/10" : "border-border bg-background/60"
                  }`}
                >
                  <div className="font-medium text-xs uppercase tracking-widest text-muted-foreground">
                    {m.from === "me" ? "You" : "Relay"} · {m.at}
                  </div>
                  <p className="mt-1">{m.text}</p>
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
                placeholder="Type a message..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button onClick={submitChat} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === "commerce" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Commerce</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {shopCatalog.map((item) => (
                <div key={item.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">${item.price}/mo</p>
                  <button
                    onClick={() => setCart((prev) => [...prev, item])}
                    className="mt-3 rounded-md border border-border px-3 py-1.5 text-sm hover:bg-surface"
                  >
                    Add to cart
                  </button>
                </div>
              ))}
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3">
              <p className="text-sm text-muted-foreground">Cart items: {cart.length}</p>
              <p className="font-semibold">Total: ${cartTotal}</p>
              <button
                onClick={checkoutCart}
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
                    <div key={o.id}>
                      <button
                        onClick={() => toggleOrderItems(o.id)}
                        className="text-left hover:text-foreground"
                      >
                        #{o.id.slice(0, 8)} · ${o.total} · {o.status} · {o.createdAt}
                      </button>
                      {expandedOrderId === o.id && (
                        <div className="mt-1 pl-2 text-[11px]">
                          {(orderItemsById[o.id] ?? [o.itemSummary]).map((item) => (
                            <p key={`${o.id}-${item}`}>- {item}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Social Feed</h3>
            <div className="flex gap-2">
              <input
                value={postInput}
                onChange={(e) => setPostInput(e.target.value)}
                placeholder="Share an update..."
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button onClick={publishPost} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Post
              </button>
            </div>
            <div className="space-y-2">
              {posts.map((post) => (
                <article key={post.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <p>{post.text}</p>
                  <button
                    onClick={() => toggleLike(post)}
                    className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                  >
                    {post.liked ? "Unlike" : "Like"} · {post.likes}
                  </button>
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {comments
                      .filter((c) => c.postId === post.id)
                      .map((comment) => (
                        <p key={comment.id} className="text-sm text-muted-foreground">
                          {comment.text}
                        </p>
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
                        placeholder="Add a comment..."
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => addComment(post.id)}
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
            <div className="grid sm:grid-cols-2 gap-3">
              {filteredStreams.map((item) => {
                const isSaved = watchlist.includes(item.id);
                return (
                  <div key={item.id} className="rounded-lg border border-border bg-background/60 p-3">
                    <p className="font-medium">{item.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.category} · {item.duration}
                    </p>
                    <button
                      onClick={() => toggleWatchlist(item.id)}
                      className="mt-2 text-sm text-muted-foreground hover:text-foreground"
                    >
                      {isSaved ? "Remove from watchlist" : "Save to watchlist"}
                    </button>
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
            <div className="flex gap-2">
              <input
                value={appInput}
                onChange={(e) => setAppInput(e.target.value)}
                placeholder="Add custom mini-app name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button
                onClick={addNexosApp}
                className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
              >
                Add
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {apps.map((app) => (
                <div key={app.id} className="rounded-lg border border-border bg-background/60 p-3">
                  <p className="font-medium">{app.name}</p>
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
              Intent-first assistant that routes actions to the right NEXUS pillar.
            </p>
            <div className="flex gap-2">
              <input
                value={intentInput}
                onChange={(e) => setIntentInput(e.target.value)}
                placeholder="Example: I want to watch a movie tonight"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <button onClick={runIntent} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
                Route
              </button>
            </div>
            <div className="rounded-lg border border-border bg-background/60 p-3 text-sm">{aiResponse}</div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Profile Settings</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={displayNameInput}
                onChange={(e) => setDisplayNameInput(e.target.value)}
                placeholder="Display name"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
              <input
                value={handleInput}
                onChange={(e) => setHandleInput(e.target.value)}
                placeholder="@handle"
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={bioInput}
              onChange={(e) => setBioInput(e.target.value)}
              placeholder="Short bio"
              maxLength={240}
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
            />
            <button onClick={saveProfile} className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">
              Save profile
            </button>
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
                      {!n.readAt && (
                        <button
                          onClick={() => markNotificationRead(n.id)}
                          className="rounded-md border border-border px-2 py-1 text-xs"
                        >
                          Mark read
                        </button>
                      )}
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
        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Identity</p>
          <p className="mt-1 text-xl font-semibold">{name}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Apps launched</p>
          <p className="mt-1 text-xl font-semibold">{apps.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-surface/60 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Watchlist</p>
          <p className="mt-1 text-xl font-semibold">{watchlist.length}</p>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-surface/40 p-4 text-sm text-muted-foreground">
        <Globe className="mr-2 inline-block h-4 w-4" />
        Multi-region backend, privacy-first advertising, and zero-trust security remain roadmap integrations.
      </div>
    </div>
  );
}
