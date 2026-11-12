import { useCallback, useEffect, useState } from "react";
import { fetchHomePosts, fetchHomeStories } from "../api/home";
import type { HomePost, HomeStory } from "../api/types";
import { FeedTopBar } from "../components/feed/FeedTopBar";
import { ProviderPromoBanner } from "../components/provider/ProviderPromoBanner";
import { useProviderJourney } from "../components/provider/useProviderJourney";
import { PostCard } from "../components/feed/PostCard";
import { HomeStories } from "../components/feed/HomeStories";
import { useAuth } from "../auth/AuthContext";
import { isDropPost } from "../utils/feedOrder";
import "./HomePage.css";

export function HomePage() {
  const { token, user } = useAuth();
  const journey = useProviderJourney(token);
  const [posts, setPosts] = useState<HomePost[]>([]);
  const [stories, setStories] = useState<HomeStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeed = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [postsRes, storiesRes] = await Promise.all([
        fetchHomePosts(token),
        fetchHomeStories(token),
      ]);
      setPosts(postsRes.posts);
      setStories(storiesRes.stories ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void loadFeed();
  }, [loadFeed]);

  useEffect(() => {
    const onRefresh = () => void loadFeed();
    window.addEventListener("cropvibe:feed-refresh", onRefresh);
    return () => window.removeEventListener("cropvibe:feed-refresh", onRefresh);
  }, [loadFeed]);

  const reelPosts = posts.filter(isDropPost);

  return (
    <div className="home-page">
      <FeedTopBar />
      <HomeStories
        stories={stories}
        viewerName={user?.fullName || "You"}
        viewerAvatarUrl={user?.avatarUrl}
        viewerId={user?.id ?? null}
        viewerUsername={user?.username}
        token={token}
        onStoryDeleted={(storyId) => setStories((prev) => prev.filter((story) => story.id !== storyId))}
      />
      <ProviderPromoBanner journey={journey} />

      {loading ? <p className="home-page__status">Loading feed…</p> : null}
      {error ? <p className="home-page__error">{error}</p> : null}

      {!loading && !error && posts.length === 0 ? (
        <div className="home-page__empty">
          <p>No posts yet.</p>
        </div>
      ) : null}

      <div className="home-feed">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} reelPosts={reelPosts} />
        ))}
      </div>
    </div>
  );
}
