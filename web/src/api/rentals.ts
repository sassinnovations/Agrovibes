import { API_BASE_URL, fetchWithAuth } from "./client";

export type PublicRentalListing = {
  id: number;
  title: string;
  category: string;
  channel: string;
  status: string;
  createdAt: string;
  providerName: string;
  imageUrl?: string | null;
  dailyRate?: number | string | null;
  rateUnit?: string | null;
  locationLabel?: string | null;
  radiusKm?: number | string | null;
  distanceKm?: number | string | null;
};

export async function fetchPublicRentals(token: string | null, near?: { lat?: number | null; lng?: number | null }) {
  const params = new URLSearchParams();
  if (Number.isFinite(Number(near?.lat)) && Number.isFinite(Number(near?.lng))) {
    params.set("lat", String(near?.lat));
    params.set("lng", String(near?.lng));
  }
  const query = params.toString();
  return (await fetchWithAuth(`${API_BASE_URL}/v1/rentals/listings${query ? `?${query}` : ""}`, token)) as {
    listings: PublicRentalListing[];
  };
}

export async function bookPublicRental(
  token: string,
  payload: { listingId: string; title: string; category: string; location: string; date: string; note: string }
) {
  return (await fetchWithAuth(`${API_BASE_URL}/v1/rentals/bookings`, token, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  })) as { booking: { id: number } };
}
