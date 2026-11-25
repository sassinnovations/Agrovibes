const STORAGE_KEY = "cropvibe.rental.cart.v1";

export type WebRentalCartLine = {
  listingId: string;
  title: string;
  category: string;
  unitPrice: number;
  quantity: number;
  imageUrl?: string;
};

export function readWebRentalCart(): WebRentalCartLine[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as WebRentalCartLine[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeWebRentalCart(lines: WebRentalCartLine[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
}

export function addWebRentalCart(line: WebRentalCartLine) {
  const current = readWebRentalCart();
  const existing = current.find((item) => item.listingId === line.listingId);
  const next = existing
    ? current.map((item) =>
        item.listingId === line.listingId ? { ...item, quantity: item.quantity + 1, imageUrl: line.imageUrl || item.imageUrl } : item
      )
    : [line, ...current];
  writeWebRentalCart(next);
  return next;
}

export function clearWebRentalCart() {
  writeWebRentalCart([]);
}
