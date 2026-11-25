import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { bookPublicRental, fetchPublicRentals, type PublicRentalListing } from "../../api/rentals";
import { useAuth } from "../../auth/AuthContext";
import { portalCategoryForListing, RENTAL_CATEGORIES, rentalCategoryById } from "./rentalCatalog";
import { addWebRentalCart } from "./rentalCart";
import "./RentalsPortal.css";

function rateLabel(row: PublicRentalListing) {
  const amount = Number(String(row.dailyRate ?? "").replace(/[^0-9.]/g, ""));
  if (!Number.isFinite(amount) || amount <= 0) return "Rate on request";
  const unit = row.rateUnit?.trim();
  return `₹${Math.round(amount).toLocaleString("en-IN")}${unit ? ` / ${unit}` : ""}`;
}

export function RentalCategoryPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const { categoryId = "all" } = useParams();
  const [params] = useSearchParams();
  const location = params.get("location") || "Telangana";
  const category = categoryId === "all" ? null : rentalCategoryById(categoryId);
  const [rows, setRows] = useState<PublicRentalListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dates, setDates] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetchPublicRentals(token, { lat: user?.locationLat, lng: user?.locationLng })
      .then((data) => {
        if (!active) return;
        setRows((data.listings || []).filter((row) => String(row.status || "").toLowerCase() === "approved"));
        setError("");
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load rentals.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token, user?.locationLat, user?.locationLng]);

  const listings = useMemo(() => {
    if (!category) return rows;
    return rows.filter((row) => portalCategoryForListing(row.category, row.title) === category.id);
  }, [category, rows]);

  const book = async (row: PublicRentalListing) => {
    if (!token) {
      setError("Sign in again to book this listing.");
      return;
    }
    const date = dates[row.id] || "";
    if (date.length < 4) {
      setError("Choose a date before booking.");
      return;
    }
    setBusyId(row.id);
    setError("");
    setNotice("");
    try {
      await bookPublicRental(token, {
        listingId: String(row.id),
        title: row.title,
        category: row.category,
        location,
        date,
        note: ""
      });
      setNotice(`${row.title} is booked for ${date}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The booking was not saved.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rentals-portal">
      <Link className="rentals-back" to={`/rentals?location=${encodeURIComponent(location)}`}>
        Back
      </Link>
      <h2>{category ? category.title : "All rentals"}</h2>
      <p className="rentals-note">{category ? category.blurb : location}</p>
      {error ? <p className="rentals-error">{error}</p> : null}
      {notice ? <p className="rentals-note">{notice}</p> : null}

      {!category ? (
        <div className="rentals-grid">
          {RENTAL_CATEGORIES.map((item) => (
            <Link
              key={item.id}
              className="rentals-tile"
              style={{ backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.72)), url(${item.image})` }}
              to={`/rentals/${item.id}?location=${encodeURIComponent(location)}`}
            >
              <span>{item.title}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {loading ? <p className="rentals-note">Loading approved listings…</p> : null}
      {!loading && listings.length === 0 ? (
        <p className="rentals-note">
          No approved listings within your area yet. A listing appears here after admin approval, and only when you are inside the 5–10 km distance the provider posted.
        </p>
      ) : null}
      <div className="rentals-list">
        {listings.map((row) => (
          <article key={row.id} className="rentals-card">
            {(() => {
              const categoryId = portalCategoryForListing(row.category, row.title);
              const fallback = RENTAL_CATEGORIES.find((item) => item.id === categoryId)?.image;
              const src = row.imageUrl || fallback;
              if (!src) return null;
              return (
                <img
                  className={row.imageUrl ? "rentals-card__photo" : "rentals-card__photo rentals-card__photo--fit"}
                  src={src}
                  alt=""
                />
              );
            })()}
            <strong>{row.title}</strong>
            <p>
              {row.providerName}
              {row.category ? ` · ${row.category}` : ""}
              {row.locationLabel ? ` · ${row.locationLabel}` : ""}
              {row.distanceKm != null && row.distanceKm !== "" ? ` · ${row.distanceKm} km away` : ""}
              {` · ${rateLabel(row)}`}
            </p>
            <div className="rentals-card__row">
              <input
                type="date"
                value={dates[row.id] || ""}
                onChange={(event) => setDates((prev) => ({ ...prev, [row.id]: event.target.value }))}
              />
              <button
                type="button"
                onClick={() => {
                  const amount = Number(String(row.dailyRate ?? "").replace(/[^0-9.]/g, ""));
                  addWebRentalCart({
                    listingId: String(row.id),
                    title: row.title,
                    category: row.category,
                    unitPrice: Number.isFinite(amount) && amount > 0 ? amount : 0,
                    quantity: 1,
                    imageUrl: row.imageUrl || undefined
                  });
                  navigate(`/rentals/cart?location=${encodeURIComponent(location)}`);
                }}
              >
                Add to cart
              </button>
              <button type="button" disabled={busyId === row.id} onClick={() => void book(row)}>
                {busyId === row.id ? "Booking…" : "Book"}
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
