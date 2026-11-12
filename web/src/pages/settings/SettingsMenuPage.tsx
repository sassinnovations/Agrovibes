import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { useProviderJourney } from "../../components/provider/useProviderJourney";
import {
  SettingsIconActivity,
  SettingsIconBack,
  SettingsIconBan,
  SettingsIconBell,
  SettingsIconBookmark,
  SettingsIconChevron,
  SettingsIconInfo,
  SettingsIconLanguage,
  SettingsIconLock,
  SettingsIconLogout,
  SettingsIconPerson,
  SettingsIconStore
} from "../../components/settings/SettingsIcons";
import "./SettingsMenuPage.css";

type SettingsRowProps = {
  title: string;
  subtitle?: string;
  icon: ReactNode;
  to?: string;
  onClick?: () => void;
  showDivider?: boolean;
};

function SettingsRow({ title, subtitle, icon, to, onClick, showDivider = true }: SettingsRowProps) {
  const content = (
    <>
      <span className="settings-row__icon">{icon}</span>
      <span className="settings-row__body">
        <span className="settings-row__title">{title}</span>
        {subtitle ? <span className="settings-row__subtitle">{subtitle}</span> : null}
      </span>
      <span className="settings-row__chevron">
        <SettingsIconChevron />
      </span>
    </>
  );

  const className = `settings-row${subtitle ? " settings-row--tall" : ""}`;

  if (to) {
    return (
      <>
        <Link className={className} to={to}>
          {content}
        </Link>
        {showDivider ? <div className="settings-row__divider" /> : null}
      </>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
      {showDivider ? <div className="settings-row__divider" /> : null}
    </>
  );
}

function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="settings-section">
      <div className="settings-section__card">
        <div className="settings-section__header">
          <h2>{title}</h2>
        </div>
        {children}
      </div>
    </section>
  );
}

function PromoCard({ title, subtitle, action, onClick }: { title: string; subtitle: string; action: string; onClick?: () => void }) {
  return (
    <button type="button" className="settings-promo" onClick={onClick}>
      <p className="settings-promo__title">{title}</p>
      <p className="settings-promo__subtitle">{subtitle}</p>
      <span className="settings-promo__cta">{action}</span>
    </button>
  );
}

export function SettingsMenuPage() {
  const navigate = useNavigate();
  const { signOut, token } = useAuth();
  const journey = useProviderJourney(token);

  return (
    <div className="settings-page">
      <header className="settings-topbar">
        <button type="button" className="settings-topbar__back" onClick={() => navigate("/profile")} aria-label="Back">
          <SettingsIconBack />
        </button>
        <h1 className="settings-topbar__title">Settings &amp; Privacy</h1>
        <span className="settings-topbar__spacer" aria-hidden />
      </header>

      <div className="settings-page__scroll">
        <SettingsSection title="Your Account">
          <SettingsRow
            icon={<SettingsIconPerson />}
            title="Account Center"
            subtitle="Manage accounts, personal details, connected experiences, & preferences"
            to="/settings/account"
            showDivider={false}
          />
        </SettingsSection>

        <PromoCard
          title={journey.kind === "not_submitted" ? "Become a Rental Provider" : journey.action}
          subtitle={journey.rentalsDetail}
          action={journey.action}
          onClick={() => navigate(journey.to)}
        />

        <SettingsSection title="Provider">
          <SettingsRow
            icon={<SettingsIconStore />}
            title={journey.action}
            subtitle={journey.rentalsDetail}
            onClick={() => navigate(journey.to)}
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="How You Use Cropvibe">
          <SettingsRow icon={<SettingsIconBookmark />} title="Saved" to="/profile?tab=Saved" />
          <SettingsRow icon={<SettingsIconActivity />} title="Your Activity" to="/settings/activity" />
          <SettingsRow icon={<SettingsIconBell />} title="Notifications" to="/notifications" showDivider={false} />
        </SettingsSection>

        <SettingsSection title="Who Can See Your Content">
          <SettingsRow icon={<SettingsIconLock />} title="Account Privacy" to="/settings/privacy" />
          <SettingsRow icon={<SettingsIconBan />} title="Blocked" to="/settings/blocked" showDivider={false} />
        </SettingsSection>

        <SettingsSection title="App, Media & Accessibility Settings">
          <SettingsRow
            icon={<SettingsIconLanguage />}
            title="Language And Translations"
            to="/settings/language"
            showDivider={false}
          />
        </SettingsSection>

        <SettingsSection title="More Info And Support">
          <SettingsRow icon={<SettingsIconInfo />} title="About" to="/settings/about" showDivider={false} />
        </SettingsSection>

        <div className="settings-logout-wrap">
          <button
            type="button"
            className="settings-logout"
            onClick={() => {
              signOut();
              navigate("/login");
            }}
          >
            <SettingsIconLogout size={22} />
            Log Out
          </button>
        </div>
      </div>
    </div>
  );
}
