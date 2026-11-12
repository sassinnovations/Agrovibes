import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { fetchPublicRentals, type PublicRentalListing } from "../../api/rentals";
import { useProviderJourney } from "../../components/provider/useProviderJourney";
import { featuredRentalCategories, portalCategoryForListing, RENTAL_CATEGORIES, RENTAL_LOCATIONS } from "./rentalCatalog";
import "./RentalsPortal.css";

const BANNERS = [
  {
    id: "machinery",
    kicker: "Rental bookings",
    title: "Ready for your next big job?",
    subtitle: "Find the right machinery for your farm.",
    action: "Explore rentals"
  },
  {
    id: "drone",
    kicker: "Drone services",
    title: "Spray the field from above",
    subtitle: "Book a pilot for crop spraying.",
    action: "Book a drone"
  },
  {
    id: "labour",
    kicker: "Farm labour",
    title: "A crew for the busy days",
    subtitle: "Sowing, weeding, and harvest help.",
    action: "Hire a crew"
  },
  {
    id: "soil",
    kicker: "Soil and crop care",
    title: "Know what the soil needs",
    subtitle: "Sample pickup and a nutrient report.",
    action: "Book a test"
  }
];

export function RentalsPortalPage() {
  const { token } = useAuth();
  const journey = useProviderJourney(token);
  const [location, setLocation] = useState("Add location");
  const [locationOpen, setLocationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [listings, setListings] = useState<PublicRentalListing[]>([]);
  const categories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle
      ? RENTAL_CATEGORIES.filter((item) => `${item.title} ${item.blurb}`.toLowerCase().includes(needle))
      : featuredRentalCategories();
    return source;
  }, [query]);

  useEffect(() => {
    let active = true;
    fetchPublicRentals(token)
      .then((data) => {
        if (!active) return;
        setListings((data.listings || []).filter((row) => String(row.status || "").toLowerCase() === "approved"));
      })
      .catch(() => {
        if (active) setListings([]);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const visibleListings = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return listings;
    return listings.filter((row) => `${row.title} ${row.category} ${row.providerName}`.toLowerCase().includes(needle));
  }, [listings, query]);

  return (
    <section className="rentals-portal">
      <header className="rentals-portal__header">
        <img className="rentals-portal__logo" src="/logo-wordmark.png" alt="Cropvibe" />
      </header>

      <button type="button" className="rentals-portal__location" onClick={() => setLocationOpen((open) => !open)}>
        <span className="rentals-portal__kicker">Your location</span>
        <span className="rentals-portal__location-value">{location}</span>
      </button>
      {locationOpen ? (
        <div className="rentals-sheet">
          {RENTAL_LOCATIONS.map((name) => (
            <button
              key={name}
              type="button"
              className={name === location ? "is-active" : ""}
              onClick={() => {
                setLocation(name);
                setLocationOpen(false);
              }}
            >
              {name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rentals-choices">
        <a className="rentals-choice" href="#find-equipment">
          <strong>Find Equipment</strong>
          <span>Find tractors and farming equipment for rent.</span>
        </a>
        <Link className="rentals-choice rentals-choice--list" to={journey.to}>
          <strong>{journey.rentalsTitle}</strong>
          <span>{journey.rentalsDetail}</span>
          <em>{journey.action}</em>
        </Link>
      </div>

      <div className="rentals-banners" id="find-equipment">
        {BANNERS.map((banner) => (
          <Link key={banner.id} className="rentals-banner" to={`/rentals/${banner.id}?location=${encodeURIComponent(location)}`}>
            <div>
              <small>{banner.kicker}</small>
              <strong>{banner.title}</strong>
              <em>{banner.subtitle}</em>
            </div>
            <b>{banner.action} →</b>
          </Link>
        ))}
      </div>

      <h2>What do you need today?</h2>
      <label className="rentals-search">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search tractors, drones, labour..."
        />
      </label>

      <div className="rentals-section-head">
        <h2>Explore categories</h2>
        <Link to={`/rentals/all?location=${encodeURIComponent(location)}`}>View all →</Link>
      </div>
      {categories.length === 0 ? <p className="rentals-note">No rentals match that search.</p> : null}
      <div className="rentals-grid">
        {categories.map((item) => (
          <Link
            key={item.id}
            className="rentals-tile"
            style={{ background: item.wash }}
            to={`/rentals/${item.id}?location=${encodeURIComponent(location)}`}
          >
            <span>{item.title}</span>
          </Link>
        ))}
      </div>

      <div className="rentals-section-head">
        <h2>Approved rentals</h2>
      </div>
      {visibleListings.length === 0 ? (
        <p className="rentals-note">No approved provider listings yet. A listing shows here after admin approves it.</p>
      ) : (
        <div className="rentals-list">
          {visibleListings.map((row) => (
            <Link
              key={row.id}
              className="rentals-card"
              to={`/rentals/${portalCategoryForListing(row.category, row.title)}?location=${encodeURIComponent(location)}`}
            >
              <strong>{row.title}</strong>
              <p>
                {row.providerName}
                {row.category ? ` · ${row.category}` : ""}
              </p>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
