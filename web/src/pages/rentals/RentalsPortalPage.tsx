import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { featuredRentalCategories, RENTAL_CATEGORIES, RENTAL_LOCATIONS } from "./rentalCatalog";
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
  const [location, setLocation] = useState("Add location");
  const [locationOpen, setLocationOpen] = useState(false);
  const [query, setQuery] = useState("");
  const categories = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const source = needle
      ? RENTAL_CATEGORIES.filter((item) => `${item.title} ${item.blurb}`.toLowerCase().includes(needle))
      : featuredRentalCategories();
    return source;
  }, [query]);

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

      <div className="rentals-banners">
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
    </section>
  );
}
