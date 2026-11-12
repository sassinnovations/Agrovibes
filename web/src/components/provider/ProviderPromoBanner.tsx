import { Link } from "react-router-dom";
import type { ProviderJourney } from "./useProviderJourney";
import "./ProviderPromoBanner.css";

export function ProviderPromoBanner({ journey }: { journey: ProviderJourney }) {
  if (journey.kind !== "not_submitted") {
    return (
      <section className="provider-banner">
        <p className="provider-banner__kicker">Rental provider</p>
        <h2>{journey.action}</h2>
        <p>{journey.rentalsDetail}</p>
        <Link className="provider-banner__cta" to={journey.to}>
          {journey.action}
        </Link>
      </section>
    );
  }

  return (
    <section className="provider-banner">
      <p className="provider-banner__kicker">Earn with Your Farm Equipment</p>
      <h2>Turn your idle machinery into income.</h2>
      <p className="provider-banner__line">Your Equipment. Your Earnings.</p>
      <p>List your tractors, harvesters and farming equipment on CropVibe. Connect with farmers looking to rent.</p>
      <Link className="provider-banner__cta" to={journey.to}>
        Become a Rental Provider
      </Link>
    </section>
  );
}
