import { Link, useParams, useSearchParams } from "react-router-dom";
import { RENTAL_CATEGORIES, RENTAL_VISUALS, rentalCategoryById } from "./rentalCatalog";
import "./RentalsPortal.css";

export function RentalCategoryPage() {
  const { categoryId = "all" } = useParams();
  const [params] = useSearchParams();
  const location = params.get("location") || "Telangana";
  const category = categoryId === "all" ? null : rentalCategoryById(categoryId);
  const visuals = category ? RENTAL_VISUALS.filter((item) => item.categoryId === category.id) : [];

  return (
    <section className="rentals-portal">
      <Link className="rentals-back" to={`/rentals?location=${encodeURIComponent(location)}`}>
        Back
      </Link>
      <h2>{category ? category.title : "All rentals"}</h2>
      <p className="rentals-note">{category ? category.blurb : location}</p>

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
      ) : (
        <div className="rentals-grid">
          {visuals.map((item) => (
            <article key={item.id} className="rentals-tile" style={{ backgroundImage: `linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.72)), url(${item.image})` }}>
              <span>{item.title}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
