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
  value,
  placeholder,
  options,
  disabled,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  options: string[];
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const shown = useMemo(() => filterPlaces(options, query), [options, query]);
  const showList = open && query.trim().length > 0;

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const onPointer = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onPointer);
    return () => document.removeEventListener("mousedown", onPointer);
  }, []);

  const pick = (name: string) => {
    onChange(name);
    setQuery(name);
    setOpen(false);
  };

  return (
    <div className="join-label join-combo" ref={rootRef}>
      <span>{label}</span>
      <input
        className="join-input"
        value={query}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          const next = event.target.value;
          setQuery(next);
          setOpen(true);
          if (!next.trim()) onChange("");
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") setOpen(false);
          if (event.key === "Enter" && shown[0]) {
            event.preventDefault();
            pick(shown[0]);
          }
        }}
      />
      {showList ? (
        <div className="join-combo__list" id={listId} role="listbox">
          {shown.length === 0 ? (
            <p className="join-combo__empty">No places found.</p>
          ) : (
            shown.map((name) => (
              <button
                key={name}
                type="button"
                role="option"
                aria-selected={name === value}
                className={`join-combo__option${name === value ? " is-active" : ""}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => pick(name)}
              >
                {name}
              </button>
            ))
          )}
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
        value={stateName}
        placeholder="Type state"
        options={states}
        onChange={(name) => {
          onChangeState(name);
          onChangeDistrict("");
          onChangeCity("");
        }}
      />
      <PlaceCombobox
        label="District"
        value={district}
        placeholder="Type district"
        options={districts}
        disabled={!stateName}
        onChange={(name) => {
          onChangeDistrict(name);
          onChangeCity("");
        }}
      />
      <PlaceCombobox
        label="City"
        value={city}
        placeholder="Type city"
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
