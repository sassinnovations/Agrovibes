import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { bookPublicRental } from "../../api/rentals";
import { useAuth } from "../../auth/AuthContext";
import { LocationMapPicker } from "../../components/profile/LocationMapPicker";
import { clearWebRentalCart, readWebRentalCart, type WebRentalCartLine } from "./rentalCart";
import "./RentalsPortal.css";

const TIMES = ["6:00 AM", "7:00 AM", "8:00 AM", "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM", "6:00 PM"];

function rupee(n: number) {
  return "\u20B9" + n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function RentalCartPage() {
  const { token, user } = useAuth();
  const [params] = useSearchParams();
  const [lines, setLines] = useState<WebRentalCartLine[]>(() => readWebRentalCart());
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState(params.get("location") || user?.locationLabel || "");
  const [lat, setLat] = useState<number | null>(() => {
    const value = Number(params.get("lat"));
    return Number.isFinite(value) ? value : user?.locationLat ?? null;
  });
  const [lng, setLng] = useState<number | null>(() => {
    const value = Number(params.get("lng"));
    return Number.isFinite(value) ? value : user?.locationLng ?? null;
  });
  const [mapOpen, setMapOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0), [lines]);

  const clear = () => {
    clearWebRentalCart();
    setLines([]);
    setDone("");
  };

  const createBooking = async () => {
    if (!token) {
      setError("Sign in again to create this booking.");
      return;
    }
    if (!lines.length || busy) return;
    if (!date) {
      setError("Select a date.");
      return;
    }
    if (!time) {
      setError("Select a time.");
      return;
    }
    if (place.trim().length < 3) {
      setError("Add the location for this booking.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      for (const line of lines) {
        const title = line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title;
        await bookPublicRental(token, {
          listingId: line.listingId,
          title,
          category: line.category,
          location: place.trim(),
          date,
          note: `Time ${time}`
        });
      }
      clearWebRentalCart();
      setLines([]);
      setDone(`Booking created for ${date} at ${time}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "The booking was not saved.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="cart-page">
      <header className="cart-page__bar">
        <Link className="cart-page__round" to="/rentals" aria-label="Back">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M15 18 9 12l6-6" />
          </svg>
        </Link>
        <h1>My Cart</h1>
        <button type="button" className="cart-page__round" onClick={clear} aria-label="Clear cart">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M4 7h16M9 7V5h6v2M8 7l1 13h6l1-13" />
          </svg>
        </button>
      </header>

      {done ? <p className="cart-page__done">{done}</p> : null}
      {lines.length === 0 && !done ? <p className="cart-page__empty">Your cart is empty.</p> : null}

      {lines.map((line) => (
        <article key={line.listingId} className="cart-page__item">
          <div>
            <strong>{line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title}</strong>
            <em>{rupee(line.unitPrice * line.quantity)}</em>
          </div>
          {line.imageUrl ? <img src={line.imageUrl} alt="" /> : <span className="cart-page__photo" />}
        </article>
      ))}

      {lines.length > 0 ? (
        <>
          <div className="cart-page__split">
            <label>
              <svg viewBox="0 0 24 24" aria-hidden>
                <rect x="4" y="5" width="16" height="15" rx="2" />
                <path d="M8 3v4M16 3v4M4 10h16" />
              </svg>
              <span>
                Date
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </span>
            </label>
            <label>
              <svg viewBox="0 0 24 24" aria-hidden>
                <circle cx="12" cy="12" r="8" />
                <path d="M12 8v5l3 2" />
              </svg>
              <span>
                Time
                <select value={time} onChange={(event) => setTime(event.target.value)}>
                  <option value="">Select</option>
                  {TIMES.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </span>
            </label>
          </div>

          <button type="button" className="cart-page__location" onClick={() => setMapOpen(true)}>
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" />
              <circle cx="12" cy="10" r="2.2" />
            </svg>
            <span>
              Location
              <strong>{place || "Select on Google Maps"}</strong>
            </span>
          </button>
          <LocationMapPicker
            open={mapOpen}
            label={place}
            lat={lat}
            lng={lng}
            onClose={() => setMapOpen(false)}
            onSelect={(value) => {
              setPlace(value.label);
              setLat(value.lat);
              setLng(value.lng);
              setMapOpen(false);
            }}
          />

          <h2>Bill summary</h2>
          <div className="cart-page__receipt">
            {lines.map((line) => (
              <p key={`bill-${line.listingId}`}>
                <span>{line.quantity > 1 ? `${line.title} × ${line.quantity}` : line.title}</span>
                <b>{rupee(line.unitPrice * line.quantity)}</b>
              </p>
            ))}
            <p>
              <span>Tax</span>
              <b>{rupee(0)}</b>
            </p>
            <p className="is-total">
              <span>Total Amount</span>
              <b>{rupee(subtotal)}</b>
            </p>
          </div>

          <p className="cart-page__disclaimer">
            <strong>*Disclaimer</strong>
            Once you click the "proceed to checkout" button, you can not change date, time & location.
          </p>
          {error ? <p className="rentals-error">{error}</p> : null}

          <footer className="cart-page__footer">
            <p>
              <span>Sub Total</span>
              <b>{rupee(subtotal)}</b>
            </p>
            <button type="button" onClick={() => void createBooking()} disabled={busy}>
              {busy ? "Creating…" : "Create Booking"}
            </button>
          </footer>
        </>
      ) : null}
    </section>
  );
}
