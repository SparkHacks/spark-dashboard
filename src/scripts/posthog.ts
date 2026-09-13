import posthog from "posthog-js";

const key = import.meta.env.PUBLIC_POSTHOG_KEY;

export function initPostHog({ email, isStaff }: { email?: string; isStaff: boolean }) {
  if (!key || posthog.__loaded) return;

  posthog.init(key, {
    api_host: "/ingest",
    ui_host: "https://us.posthog.com",
    defaults: "2026-05-30",
    person_profiles: "identified_only",
    capture_exceptions: true,
    // staff pages show other applicants' data
    disable_session_recording: isStaff || window.location.pathname.startsWith("/admin"),
    session_recording: {
      maskAllInputs: true,
    },
  });

  if (email) {
    posthog.identify(email, { email });
  }
}

export default posthog;
