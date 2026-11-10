import { useEffect, useId, useMemo, useRef, useState } from "react";
import { fetchLocationCities, fetchLocationDistricts, fetchLocationStates } from "../../api/providerKyc";

function filterPlaces(options: string[], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return options;
  const starts: string[] = [];
  const contains: string[] = [];
  for (const name of options) {
    const lower = name.toLowerCase();
    if (lower.startsWith(needle)) starts.push(name);
    else if (lower.includes(needle)) contains.push(name);
  }
  return [...starts, ...contains];
}

function PlaceCombobox({
  label,
  sheetTitle,
  value,
  placeholder,
  options,
  disabled,
  onChange
}: {
  label: string;
  sheetTitle: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const shown = useMemo(() => filterPlaces(options, query), [options, query]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    searchRef.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const close = () => setOpen(false);
  const openSheet = () => {
    if (disabled) return;
    setQuery("");
    setOpen(true);
  };

  return (
    <div className="join-label">
      <span>{label}</span>
      <button
        type="button"
        className={`join-select${disabled ? " is-disabled" : ""}`}
        disabled={disabled}
        onClick={openSheet}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <span className={value ? "join-select__value" : "join-select__placeholder"}>{value || placeholder}</span>
        <svg viewBox="0 0 24 24" aria-hidden>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open ? (
        <div className="join-sheet-backdrop" onClick={close}>
          <div
            className="join-sheet"
            role="dialog"
            aria-label={sheetTitle}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{sheetTitle}</h3>
            <input
              ref={searchRef}
              className="join-input join-sheet__search"
              placeholder="Type to search"
              value={query}
              aria-controls={listId}
              aria-autocomplete="list"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && shown[0]) {
                  event.preventDefault();
                  onChange(shown[0]);
                  close();
                }
              }}
            />
            <div className="join-sheet__list" id={listId} role="listbox">
              {shown.length === 0 ? (
                <p className="join-sheet__empty">No places found.</p>
              ) : (
                shown.map((name) => (
                  <button
                    key={name}
                    type="button"
                    role="option"
                    aria-selected={name === value}
                    className={`join-sheet__option${name === value ? " is-active" : ""}`}
                    onClick={() => {
                      onChange(name);
                      close();
                    }}
                  >
                    {name}
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  address: string;
  stateName: string;
  district: string;
  city: string;
  pinCode: string;
  onChangeAddress: (value: string) => void;
  onChangeState: (value: string) => void;
  onChangeDistrict: (value: string) => void;
  onChangeCity: (value: string) => void;
  onChangePin: (value: string) => void;
};

export function AddressDetailsFields({
  address,
  stateName,
  district,
  city,
  pinCode,
  onChangeAddress,
  onChangeState,
  onChangeDistrict,
  onChangeCity,
  onChangePin
}: Props) {
  const [states, setStates] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;
    fetchLocationStates()
      .then((result) => {
        if (active) setStates(result.states.map((item) => item.name));
      })
      .catch(() => {
        if (active) setLoadError("Could not load states.");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!stateName) {
      setDistricts([]);
      return;
    }
    let active = true;
    fetchLocationDistricts(stateName)
      .then((result) => {
        if (active) setDistricts(result.districts);
      })
      .catch(() => {
        if (active) setLoadError("Could not load districts.");
      });
    return () => {
      active = false;
    };
  }, [stateName]);

  useEffect(() => {
    if (!stateName || !district) {
      setCities([]);
      return;
    }
    let active = true;
    fetchLocationCities(stateName, district)
      .then((result) => {
        if (active) setCities(result.cities);
      })
      .catch(() => {
        if (active) setLoadError("Could not load cities.");
      });
    return () => {
      active = false;
    };
  }, [stateName, district]);

  return (
    <div className="join-address">
      <h3 className="join-location">Address details</h3>
      <label className="join-label">
        Address
        <input className="join-input" placeholder="Enter address" value={address} onChange={(event) => onChangeAddress(event.target.value)} />
      </label>
      <PlaceCombobox
        label="State"
        sheetTitle="Select state"
        value={stateName}
        placeholder="Select state"
        options={states}
        onChange={(name) => {
          onChangeState(name);
          onChangeDistrict("");
          onChangeCity("");
        }}
      />
      <PlaceCombobox
        label="District"
        sheetTitle="Select district"
        value={district}
        placeholder="Select district"
        options={districts}
        disabled={!stateName}
        onChange={(name) => {
          onChangeDistrict(name);
          onChangeCity("");
        }}
      />
      <PlaceCombobox
        label="City"
        sheetTitle="Select city"
        value={city}
        placeholder="Select city"
        options={cities}
        disabled={!district}
        onChange={onChangeCity}
      />
      <label className="join-label">
        PIN code
        <input
          className="join-input"
          placeholder="6-digit PIN code"
          inputMode="numeric"
          value={pinCode}
          onChange={(event) => onChangePin(event.target.value.replace(/\D/g, "").slice(0, 6))}
        />
      </label>
      {loadError ? <p className="join-error">{loadError}</p> : null}
    </div>
  );
}
