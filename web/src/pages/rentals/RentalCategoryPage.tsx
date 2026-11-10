import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { bookPublicRental, fetchPublicRentals, type PublicRentalListing } from "../../api/rentals";
import { portalCategoryForListing, RENTAL_CATEGORIES, rentalCategoryById } from "./rentalCatalog";
import "./RentalsPortal.css";

export function RentalCategoryPage() {
  const { token } = useAuth();
  const { categoryId = "all" } = useParams();
  const [params] = useSearchParams();
  const location = params.get("location") || "Telangana";
  const category = categoryId === "all" ? null : rentalCategoryById(categoryId);
  const [rows, setRows] = useState<PublicRentalListing[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dates, setDates] = useState<Record<number, string>>({});
  const [busyId, setBusyId] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    fetchPublicRentals(token)
      .then((data) => {
        if (!active) return;
        setRows((data.listings || []).filter((row) => String(row.status || "").toLowerCase() === "approved"));
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Could not load rentals.");
      });
    return () => {
      active = false;
    };
  }, [token]);

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
      <p className="rentals-note">{location}</p>
      {error ? <p className="rentals-error">{error}</p> : null}
      {notice ? <p className="rentals-note">{notice}</p> : null}

      {!category ? (
        <div className="rentals-list">
          {RENTAL_CATEGORIES.map((item) => (
            <Link key={item.id} className="rentals-card" to={`/rentals/${item.id}?location=${encodeURIComponent(location)}`}>
              <strong>{item.title}</strong>
              <p>{item.blurb}</p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rentals-list">
          {listings.length === 0 ? (
            <p className="rentals-note">No approved listings in this category yet. A listing shows here after admin approves it.</p>
          ) : (
            listings.map((row) => (
              <article key={row.id} className="rentals-card">
                <strong>{row.title}</strong>
                <p>
                  {row.category} · {row.channel}
                  {row.providerName ? ` · ${row.providerName}` : ""}
                </p>
                <div className="rentals-card__row">
                  <input
                    type="date"
                    value={dates[row.id] || ""}
                    onChange={(event) => setDates((prev) => ({ ...prev, [row.id]: event.target.value }))}
                  />
                  <button type="button" disabled={busyId === row.id} onClick={() => void book(row)}>
                    {busyId === row.id ? "Booking…" : "Book"}
                  </button>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
