import { useEffect, useState } from "react";
import { fetchProviderKycStatus, fetchProviderListings } from "../../api/providerKyc";

export type ProviderJourneyKind = "not_submitted" | "pending" | "rejected" | "approved" | "active";

export type ProviderJourney = {
  kind: ProviderJourneyKind;
  action: string;
  to: string;
  rentalsTitle: string;
  rentalsDetail: string;
};

const notRegistered: ProviderJourney = {
  kind: "not_submitted",
  action: "Become a Rental Provider",
  to: "/provider/join?step=role",
  rentalsTitle: "List Equipment",
  rentalsDetail: "Register as a provider and list your equipment."
};

const pending: ProviderJourney = {
  kind: "pending",
  action: "Your application is under review",
  to: "/provider/join",
  rentalsTitle: "Application under review",
  rentalsDetail: "Your rental provider application is with the admin team."
};

const rejected: ProviderJourney = {
  kind: "rejected",
  action: "Update your KYC details",
  to: "/provider/join",
  rentalsTitle: "Update your KYC details",
  rentalsDetail: "Review the application and submit your KYC again."
};

const approved: ProviderJourney = {
  kind: "approved",
  action: "Open Provider Dashboard",
  to: "/provider",
  rentalsTitle: "Open Provider Dashboard",
  rentalsDetail: "Your KYC is approved. List tractors, harvesters, and other equipment."
};

const activeProvider: ProviderJourney = {
  kind: "active",
  action: "Manage Your Listings",
  to: "/provider/listings",
  rentalsTitle: "Manage Your Listings",
  rentalsDetail: "Update the equipment farmers can rent."
};

export function useProviderJourney(token: string | null) {
  const [journey, setJourney] = useState<ProviderJourney>(notRegistered);

  useEffect(() => {
    if (!token) {
      setJourney(notRegistered);
      return;
    }
    let active = true;
    void (async () => {
      try {
        const kyc = await fetchProviderKycStatus(token);
        const status = String(kyc.status || "not_submitted").toLowerCase();
        if (status === "approved") {
          try {
            const listed = await fetchProviderListings(token);
            const count = (listed.listings || []).length;
            if (active) setJourney(count > 0 ? activeProvider : approved);
          } catch {
            if (active) setJourney(approved);
          }
          return;
        }
        if (!active) return;
        if (status === "pending") setJourney(pending);
        else if (status === "rejected") setJourney(rejected);
        else setJourney(notRegistered);
      } catch {
        if (active) setJourney(notRegistered);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  return journey;
}
