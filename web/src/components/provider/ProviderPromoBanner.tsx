import { Link } from "react-router-dom";
import type { ProviderJourney } from "./useProviderJourney";
import "./ProviderPromoBanner.css";

export function ProviderPromoBanner({ journey }: { journey: ProviderJourney }) {
  const slides =
    journey.kind === "not_submitted"
      ? [
          {
            kicker: "Earn with Your Farm Equipment",
            title: "Turn your idle machinery into income.",
            subtitle: "Your Equipment. Your Earnings."
          },
          {
            kicker: "Your Equipment. Your Earnings.",
            title: "List tractors and harvesters",
            subtitle: "Connect with farmers looking to rent on CropVibe."
          }
        ]
      : [
          {
            kicker: "Rental provider",
            title: journey.action,
            subtitle: journey.rentalsDetail
          }
        ];

  return (
    <div className="provider-banners">
      {slides.map((slide) => (
        <Link key={slide.title} className="provider-banners__card" to={journey.to}>
          <small>{slide.kicker}</small>
          <strong>{slide.title}</strong>
          <em>{slide.subtitle}</em>
          <b>{journey.action} →</b>
        </Link>
      ))}
    </div>
  );
}
