import { API_BASE_URL, fetchWithAuth } from "./client";

export type PublicRentalListing = {
  id: number;
  title: string;
  category: string;
  channel: string;
  status: string;
  createdAt: string;
  providerName: string;
};

export async function fetchPublicRentals(token: string | null) {
  return (await fetchWithAuth(`${API_BASE_URL}/v1/rentals/listings`, token)) as {
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
