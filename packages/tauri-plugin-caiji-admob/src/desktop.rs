use serde::de::DeserializeOwned;
use tauri::{plugin::PluginApi, AppHandle, Runtime};

use crate::models::*;

pub fn init<R: Runtime, C: DeserializeOwned>(
    app: &AppHandle<R>,
    _api: PluginApi<R, C>,
) -> crate::Result<GoogleAdmob<R>> {
    Ok(GoogleAdmob(app.clone()))
}

/// Desktop stub. AdMob ships no desktop SDK, so every ad call returns
/// `Error::UnsupportedPlatform`.
///
/// Why an error and not `Ok { shown: false }`, which is what upstream returned: a silent success
/// lets a caller believe ads are live while nothing happens. `ads.svelte.ts` flips
/// `available = true` on any resolved `initialize()`, so a mock-Ok would turn every later call
/// into a no-op that still reports success -- the hardest kind of bug to spot. Failing loudly
/// means a misrouted build (say the vite `$ads` alias not switching over to ads-noop) shows up
/// on the first call instead of silently earning nothing.
///
/// Worth knowing: this module is what `cargo check` compiles on a dev machine. None of the
/// Android implementation is type-checked there, so a green `cargo check` says nothing about
/// whether the real plugin works.
pub struct GoogleAdmob<R: Runtime>(AppHandle<R>);

impl<R: Runtime> GoogleAdmob<R> {
    // ============== Initialize ==============

    pub fn initialize(&self, _payload: InitializeRequest) -> crate::Result<InitializeResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Consent (UMP / GDPR) ==============

    pub fn request_consent(
        &self,
        _payload: RequestConsentRequest,
    ) -> crate::Result<ConsentResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn get_consent_status(&self) -> crate::Result<ConsentResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn show_privacy_options_form(&self) -> crate::Result<ShowPrivacyOptionsResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Banner Ads ==============

    pub fn show_banner(&self, _payload: BannerAdOptions) -> crate::Result<ShowBannerResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn hide_banner(&self) -> crate::Result<HideBannerResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Interstitial Ads ==============

    pub fn prepare_interstitial(
        &self,
        _payload: InterstitialAdOptions,
    ) -> crate::Result<PrepareInterstitialResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn show_interstitial(&self) -> crate::Result<ShowInterstitialResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Rewarded Ads ==============

    pub fn prepare_rewarded(
        &self,
        _payload: RewardedAdOptions,
    ) -> crate::Result<PrepareRewardedResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn show_rewarded(&self) -> crate::Result<ShowRewardedResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Rewarded Interstitial Ads ==============

    pub fn prepare_rewarded_interstitial(
        &self,
        _payload: RewardedInterstitialAdOptions,
    ) -> crate::Result<PrepareRewardedInterstitialResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn show_rewarded_interstitial(&self) -> crate::Result<ShowRewardedInterstitialResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== App Open Ads ==============

    pub fn prepare_app_open(
        &self,
        _payload: AppOpenAdOptions,
    ) -> crate::Result<PrepareAppOpenResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    pub fn show_app_open(&self) -> crate::Result<ShowAppOpenResponse> {
        Err(crate::Error::UnsupportedPlatform)
    }

    // ============== Legacy (keeping for compatibility) ==============

    /// The one call that still succeeds here: it never touches the ads SDK, so it stays usable as
    /// a "is the plugin wired up at all?" probe on any platform.
    pub fn ping(&self, payload: PingRequest) -> crate::Result<PingResponse> {
        Ok(PingResponse {
            value: payload.value,
        })
    }
}
