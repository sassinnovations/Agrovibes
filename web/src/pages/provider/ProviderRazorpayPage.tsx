import { useEffect, useMemo, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { createProviderRazorpayAccount } from "../../api/providerKyc";
import { readProviderDraft, writeProviderDraft } from "./providerDraft";
import { readSavedBank, writeSavedBank } from "./ProviderBankPage";

function digits(value: string, max: number) {
  return value.replace(/\D/g, "").slice(0, max);
}

function missingRazorpayField(fields: { email: string; phone: string; street: string; city: string; state: string; pin: string }) {
  if (!fields.email.includes("@")) return "Add an email address to link Razorpay.";
  if (digits(fields.phone, 10).length !== 10) return "Add a 10-digit mobile number to link Razorpay.";
  if (fields.street.trim().length <= 1) return "Add the street to link Razorpay.";
  if (fields.city.trim().length <= 1) return "Add the city to link Razorpay.";
  if (fields.state.trim().length <= 1) return "Add the state to link Razorpay.";
  if (digits(fields.pin, 6).length !== 6) return "Add the 6-digit PIN code to link Razorpay.";
  return "";
}

function Field({
  label,
  name,
  value,
  locked,
  onChange,
  inputMode,
  autoComplete
}: {
  label: string;
  name: string;
  value: string;
  locked: boolean;
  onChange: (value: string) => void;
  inputMode?: "email" | "numeric" | "text";
  autoComplete?: string;
}) {
  return (
    <label>
      {label}
      {locked ? (
        <span className="provider-bank__readonly">{value}</span>
      ) : (
        <input
          name={name}
          value={value}
          autoComplete={autoComplete}
          inputMode={inputMode === "numeric" ? "numeric" : inputMode === "email" ? "email" : "text"}
          onChange={(event) => onChange(event.target.value)}
          onInput={(event) => onChange(event.currentTarget.value)}
          onBlur={(event) => onChange(event.currentTarget.value)}
        />
      )}
    </label>
  );
}

export function ProviderRazorpayPage() {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const bank = readSavedBank();
  const draft = readProviderDraft();
  const preset = useMemo(
    () => ({
      email: draft.email.trim() || user?.email?.trim() || "",
      phone: digits(draft.phone || user?.phone || "", 10),
      street: (draft.street || draft.village).trim(),
      city: (draft.district || draft.village).trim(),
      state: draft.state.trim(),
      pin: digits(draft.pinCode, 6)
    }),
    [draft.district, draft.email, draft.phone, draft.pinCode, draft.state, draft.street, draft.village, user?.email, user?.phone]
  );
  const [email, setEmail] = useState(preset.email);
  const [phone, setPhone] = useState(preset.phone);
  const [street, setStreet] = useState(preset.street);
  const [city, setCity] = useState(preset.city);
  const [state, setState] = useState(preset.state);
  const [pin, setPin] = useState(preset.pin);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setEmail((current) => current || preset.email);
    setPhone((current) => current || preset.phone);
    setStreet((current) => current || preset.street);
    setCity((current) => current || preset.city);
    setState((current) => current || preset.state);
    setPin((current) => current || preset.pin);
  }, [preset]);

  useEffect(() => {
    const node = formRef.current;
    if (!node) return;
    const pull = () => {
      const read = (name: string) => (node.elements.namedItem(name) as HTMLInputElement | null)?.value?.trim() || "";
      const nextEmail = read("email");
      const nextPhone = digits(read("phone"), 10);
      const nextStreet = read("street");
      const nextCity = read("city");
      const nextState = read("state");
      const nextPin = digits(read("pin"), 6);
      if (nextEmail) setEmail((current) => current || nextEmail);
      if (nextPhone) setPhone((current) => current || nextPhone);
      if (nextStreet) setStreet((current) => current || nextStreet);
      if (nextCity) setCity((current) => current || nextCity);
      if (nextState) setState((current) => current || nextState);
      if (nextPin) setPin((current) => current || nextPin);
    };
    pull();
    const timer = window.setTimeout(pull, 400);
    node.addEventListener("change", pull);
    return () => {
      window.clearTimeout(timer);
      node.removeEventListener("change", pull);
    };
  }, []);

  if (!bank) return <Navigate to="/provider/bank" replace />;
  if (bank.razorpayAccountId) return <Navigate to="/provider" replace />;

  const ready =
    email.includes("@") &&
    digits(phone, 10).length === 10 &&
    street.trim().length > 1 &&
    city.trim().length > 1 &&
    state.trim().length > 1 &&
    digits(pin, 6).length === 6;

  const linkAccount = async () => {
    if (!token || !ready) return;
    setBusy(true);
    setError("");
    try {
      const linked = await createProviderRazorpayAccount(token, {
        accountNumber: bank.accountNumber,
        ifsc: bank.ifsc,
        holderName: bank.holderName,
        email: email.trim(),
        phone: digits(phone, 10),
        businessName: draft.businessName || draft.fullName || bank.holderName,
        street: street.trim(),
        city: city.trim(),
        state: state.trim(),
        postalCode: digits(pin, 6)
      });
      if (!linked.linked || !linked.accountId) {
        setError(linked.message || "Razorpay did not link an account yet.");
        return;
      }
      writeSavedBank({ ...bank, razorpayAccountId: linked.accountId });
      writeProviderDraft({
        ...readProviderDraft(),
        email: email.trim(),
        phone: digits(phone, 10),
        street: street.trim(),
        district: city.trim(),
        state: state.trim(),
        pinCode: digits(pin, 6),
        bankVerified: true,
        holderName: bank.holderName,
        accountNumber: bank.accountNumber,
        ifsc: bank.ifsc,
        bankName: bank.bankName || "",
        bankBranch: bank.bankBranch || ""
      });
      navigate("/provider");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not link the Razorpay account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="provider-panel">
      <Link className="provider-back" to="/provider">
        Back
      </Link>
      <h1>Razorpay details</h1>
      <p className="provider-note">The verified bank account stays as recorded. Other details are filled from registration and can be entered only when they are missing.</p>
      <form
        ref={formRef}
        className="provider-bank"
        onSubmit={(event) => {
          event.preventDefault();
          void linkAccount();
        }}
      >
        <Field label="Account holder" name="holder" value={bank.holderName} locked onChange={() => undefined} />
        <Field label="Account number" name="account" value={bank.accountNumber} locked onChange={() => undefined} />
        <Field label="IFSC" name="ifsc" value={bank.ifsc} locked onChange={() => undefined} />
        {bank.bankName || bank.bankBranch ? (
          <Field
            label="Bank"
            name="bank"
            value={[bank.bankName, bank.bankBranch].filter(Boolean).join(" · ")}
            locked
            onChange={() => undefined}
          />
        ) : null}
        <Field label="Email" name="email" value={email} locked={Boolean(preset.email)} onChange={setEmail} inputMode="email" autoComplete="email" />
        <Field label="Mobile" name="phone" value={phone} locked={Boolean(preset.phone)} onChange={(value) => setPhone(digits(value, 10))} inputMode="numeric" autoComplete="tel" />
        <Field label="Street" name="street" value={street} locked={Boolean(preset.street)} onChange={setStreet} autoComplete="address-line1" />
        <Field label="City" name="city" value={city} locked={Boolean(preset.city)} onChange={setCity} autoComplete="address-level2" />
        <Field label="State" name="state" value={state} locked={Boolean(preset.state)} onChange={setState} autoComplete="address-level1" />
        <Field label="PIN code" name="pin" value={pin} locked={Boolean(preset.pin)} onChange={(value) => setPin(digits(value, 6))} inputMode="numeric" autoComplete="postal-code" />
        {error ? <p className="provider-bank__error">{error}</p> : null}
        {!ready ? <p className="provider-bank__error">{missingRazorpayField({ email, phone, street, city, state, pin })}</p> : null}
        <button type="submit" disabled={busy || !ready}>
          {busy ? "Linking…" : "Link Razorpay"}
        </button>
        <Link className="provider-bank__change" to="/provider/bank?edit=1">
          Use a different bank account
        </Link>
      </form>
    </section>
  );
}
