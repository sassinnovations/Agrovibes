import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LocationMapPicker } from "../../components/profile/LocationMapPicker";
import { useProviderJourney } from "../../components/provider/useProviderJourney";
import "./RentalsPortal.css";

const SHORTCUTS = [
  { id: "machinery", label: "Equipment Rentals", icon: "tractor" },
  { id: "land", label: "Land Rentals", icon: "sprout" },
  { id: "labour", label: "Farm Services", icon: "person" },
  { id: "drone", label: "Drone Services", icon: "drone" }
] as const;

const EXPLORE = [
  { id: "tractors", categoryId: "machinery", title: "Tractors", image: "/rentals/red-tractor.png" },
  { id: "harvesters", categoryId: "machinery", title: "Harvesters", image: "/rentals/harvester.png" },
  { id: "implements", categoryId: "machinery", title: "Implements", image: "/rentals/implement.png" },
  { id: "drones", categoryId: "drone", title: "Drones", image: "/rentals/drone.png" }
];

function ShortcutIcon({ name }: { name: (typeof SHORTCUTS)[number]["icon"] }) {
  if (name === "sprout") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M12 21V11" />
        <path d="M12 13c0-4 2.5-7 7-8-1 5-4 8-7 8Z" />
        <path d="M12 15c0-3-2-5.5-6-6.5 1 4 3.2 6.5 6 6.5Z" />
      </svg>
    );
  }
  if (name === "person") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="12" cy="8" r="3" />
        <path d="M6.5 19c.8-2.6 2.8-4 5.5-4s4.7 1.4 5.5 4" />
      </svg>
    );
  }
  if (name === "drone") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden>
        <circle cx="6" cy="7" r="2.2" />
        <circle cx="18" cy="7" r="2.2" />
        <circle cx="6" cy="17" r="2.2" />
        <circle cx="18" cy="17" r="2.2" />
        <path d="M8 8.2 10.2 10.5h3.6L16 8.2M8 15.8 10.2 13.5h3.6L16 15.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden>
      <path d="M4 16.5h16M6.5 16.5v-4h11v4M8 12.5 10 8h4l2 4.5" />
      <path d="M7.5 16.5a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Zm9 0a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
    </svg>
  );
}

export function RentalsPortalPage() {
  const { token, user } = useAuth();
  const journey = useProviderJourney(token);
  const [location, setLocation] = useState(user?.locationLabel?.trim() || "Add location");
  const [lat, setLat] = useState<number | null>(user?.locationLat ?? null);
  const [lng, setLng] = useState<number | null>(user?.locationLng ?? null);
  const [mapOpen, setMapOpen] = useState(false);
  const [query, setQuery] = useState("");
  useEffect(() => {
    if (location !== "Add location") return;
    const saved = user?.locationLabel?.trim();
    if (!saved) return;
    setLocation(saved);
    setLat(user?.locationLat ?? null);
    setLng(user?.locationLng ?? null);
  }, [location, user?.locationLabel, user?.locationLat, user?.locationLng]);
  const cards = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return EXPLORE;
    return EXPLORE.filter((item) => item.title.toLowerCase().includes(needle));
  }, [query]);
  const place = (categoryId: string) => {
    const params = new URLSearchParams();
    if (location && location !== "Add location") params.set("location", location);
    if (lat != null && lng != null) {
      params.set("lat", String(lat));
      params.set("lng", String(lng));
    }
    const search = params.toString();
    return `/rentals/${categoryId}${search ? `?${search}` : ""}`;
  };

  return (
    <section className="rentals-portal">
      <header className="rentals-top">
        <Link className="rentals-cart" to={place("cart")} aria-label="Cart">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M6 6h15l-1.5 9h-12L5 3H2" />
            <circle cx="9" cy="20" r="1.4" />
            <circle cx="18" cy="20" r="1.4" />
          </svg>
        </Link>
      </header>

      <div className="rentals-title-row">
        <div className="rentals-title">
          <h1>Rentals</h1>
          <p>Rent farm equipment, land and services near you</p>
        </div>
        <Link className="rentals-provider" to={journey.to}>
          Become a Provider
        </Link>
      </div>

      <button type="button" className="rentals-portal__location" onClick={() => setMapOpen(true)}>
        <span className="rentals-pin" aria-hidden>
          <svg viewBox="0 0 24 24">
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
            <circle cx="12" cy="10" r="2.2" />
          </svg>
        </span>
        <span>
          <span className="rentals-portal__kicker">Your location</span>
          <span className="rentals-portal__location-value">{location}</span>
        </span>
      </button>
      <LocationMapPicker
        open={mapOpen}
        label={location === "Add location" ? "" : location}
        lat={lat}
        lng={lng}
        onClose={() => setMapOpen(false)}
        onSelect={(value) => {
          setLocation(value.label);
          setLat(value.lat);
          setLng(value.lng);
          setMapOpen(false);
        }}
      />

      <Link className="rentals-hero" to={place("machinery")}>
        <img src="/rentals/hero-tractor.png" alt="" />
        <span>
          <strong>
            Need Farm
            <br />
            <em>Equipment?</em>
          </strong>
          <small>Rent tractors, harvesters, tools and more from trusted providers near you.</small>
          <b>Explore Rentals →</b>
        </span>
      </Link>

      <div className="rentals-shortcuts">
        {SHORTCUTS.map((item) => (
          <Link key={item.id} className="rentals-shortcut" to={place(item.id)}>
            <ShortcutIcon name={item.icon} />
            {item.label}
          </Link>
        ))}
      </div>

      <label className="rentals-search">
        <svg viewBox="0 0 24 24" aria-hidden>
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tractors, harvesters, sprayers, land..."
        />
      </label>

      <div className="rentals-section-head">
        <h2>Explore Categories</h2>
        <Link to={place("all")}>View All →</Link>
      </div>
      {cards.length === 0 ? <p className="rentals-note">No rentals match that search.</p> : null}
      <div className="rentals-photos">
        {cards.map((item) => (
          <Link key={item.id} className="rentals-photo" to={place(item.categoryId)}>
            <img src={item.image} alt="" />
            <span>{item.title}</span>
          </Link>
        ))}
      </div>

      <div className="rentals-confidence">
        <strong>Book with Confidence</strong>
        <div>
          <span>Verified Providers</span>
          <span>Real-time Availability</span>
          <span>In-app Support</span>
        </div>
      </div>
    </section>
  );
}
