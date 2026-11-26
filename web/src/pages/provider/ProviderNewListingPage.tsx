import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { LocationMapPicker } from "../../components/profile/LocationMapPicker";
import { fetchProviderKycStatus, submitProviderListing } from "../../api/providerKyc";
import { uploadImageFile } from "../../api/uploads";
import { saveListingImage } from "./listingImages";

const CHANNELS = ["Rental", "Services", "Store", "Educators"] as const;
const CATEGORIES = ["Machinery", "Farm Equipment", "Drivers", "Labor", "Land", "Warehouse", "Drone Spraying", "Soil Testing"];

export function ProviderNewListingPage() {
  const { token, user } = useAuth();
  const [radiusKm, setRadiusKm] = useState("10");
  const [locationLabel, setLocationLabel] = useState(user?.locationLabel?.trim() || "");
  const [locationLat, setLocationLat] = useState<number | null>(user?.locationLat ?? null);
  const [locationLng, setLocationLng] = useState<number | null>(user?.locationLng ?? null);
  const [mapOpen, setMapOpen] = useState(false);
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [channel, setChannel] = useState<(typeof CHANNELS)[number]>("Rental");
  const [photo, setPhoto] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [dailyRate, setDailyRate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onPhoto = (file: File | undefined) => {
    if (!file) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = () => setPhoto(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(file);
  };

  const publish = async () => {
    if (!token || title.trim().length < 2) return;
    setBusy(true);
    setError("");
    try {
      const status = await fetchProviderKycStatus(token);
      if (status.status !== "approved") {
        setError("Admin must approve your provider registration before a listing can be submitted.");
        return;
      }
      if (locationLat == null || locationLng == null) {
        setError("Add the listing location. Farmers only see this listing inside the distance you choose around that pin.");
        return;
      }
      let imageUrl = "";
      if (photoFile) {
        const uploaded = await uploadImageFile(photoFile);
        imageUrl = uploaded.url;
      }
      const created = await submitProviderListing(token, {
        title: title.trim(),
        category,
        channel,
        imageUrl: imageUrl || undefined,
        dailyRate: dailyRate.trim() || undefined,
        rateUnit: "Day",
        locationLabel: locationLabel || user?.locationLabel || "",
        locationLat,
        locationLng,
        radiusKm: Number(radiusKm) || 10
      });
      if (imageUrl && created.listing?.id) saveListingImage(created.listing.id, imageUrl);
      else if (photo && created.listing?.id) saveListingImage(created.listing.id, photo);
      navigate(channel === "Services" ? "/provider/services" : "/provider/rental");
    } catch (err) {
      setError(err instanceof Error ? err.message : "The listing was not sent to admin.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="provider-panel">
      <h1>New listing</h1>
      <p>Same details as the phone: name, type, channel, and a photo.</p>
      <label>
        Name
        <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Swaraj 744" />
      </label>
      <label>
        Category
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          {CATEGORIES.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Channel
        <select value={channel} onChange={(event) => setChannel(event.target.value as (typeof CHANNELS)[number])}>
          {CHANNELS.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
      </label>
      <label>
        Rate (₹)
        <input value={dailyRate} onChange={(event) => setDailyRate(event.target.value)} inputMode="decimal" placeholder="800" />
      </label>
      <label>
        Listing location
        <button type="button" className="provider-location" onClick={() => setMapOpen(true)}>
          {locationLabel || "Choose on Google Maps"}
        </button>
      </label>
      <label>
        Show to farmers within
        <select value={radiusKm} onChange={(event) => setRadiusKm(event.target.value)}>
          <option value="5">5 km</option>
          <option value="10">10 km</option>
        </select>
      </label>
      <label>
        Photo
        <input type="file" accept="image/*" onChange={(event) => onPhoto(event.target.files?.[0])} />
      </label>
      {photo ? <img className="provider-card__photo" src={photo} alt="" /> : null}
      {error ? <p className="provider-error">{error}</p> : null}
      <button type="button" className="provider-btn" disabled={busy || title.trim().length < 2} onClick={() => void publish()}>
        {busy ? "Submitting…" : "Submit for approval"}
      </button>
      <LocationMapPicker
        open={mapOpen}
        label={locationLabel}
        lat={locationLat}
        lng={locationLng}
        onClose={() => setMapOpen(false)}
        onSelect={(value) => {
          setLocationLabel(value.label);
          setLocationLat(value.lat);
          setLocationLng(value.lng);
          setMapOpen(false);
        }}
      />
    </section>
  );
}
