import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchHomePosts, fetchHomeStories } from "../api/home";
import { fetchPublicRentals, type PublicRentalListing } from "../api/rentals";
import type { HomePost, HomeStory } from "../api/types";
import { FeedTopBar } from "../components/feed/FeedTopBar";
import { PostCard } from "../components/feed/PostCard";
import { HomeStories } from "../components/feed/HomeStories";
import { useAuth } from "../auth/AuthContext";
import { portalCategoryForListing } from "./rentals/rentalCatalog";
import { isDropPost } from "../utils/feedOrder";
import "./HomePage.css";

function HomeRentals({ token }: { token: string | null }) {
  const [rows, setRows] = useState<PublicRentalListing[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicRentals(token)
      .then((data) => {
        if (!active) return;
        setRows(
          (data.listings || [])
            .filter((row) => String(row.status || "").toLowerCase() === "approved")
            .slice(0, 4)
        );
      })
      .catch(() => {
        if (active) setRows([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  return (
    <section className="home-rentals">
      <div className="home-rentals__head">
        <h2>Rentals</h2>
        <Link to="/rentals">View all</Link>
      </div>
      {rows.length === 0 ? (
        <Link className="home-rentals__card" to="/rentals">
          <strong>Browse rentals</strong>
          <span>Machinery, drones, labour, and soil care from approved providers.</span>
        </Link>
      ) : (
        <div className="home-rentals__list">
          {rows.map((row) => (
            <Link
              key={row.id}
              className="home-rentals__card"
              to={`/rentals/${portalCategoryForListing(row.category, row.title)}`}
            >
              <strong>{row.title}</strong>
              <span>
                {row.providerName}
                {row.category ? ` · ${row.category}` : ""}
              </span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

export function HomePage() {
  const { token, user } = useAuth();
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
      <HomeRentals token={token} />

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
