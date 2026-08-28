use serde::{Deserialize, Serialize};

// ============== Configuration ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeRequest {
    #[serde(default)]
    pub test_device_ids: Vec<String>,
    #[serde(default)]
    pub tag_for_child_directed_treatment: Option<bool>,
    #[serde(default)]
    pub tag_for_under_age_of_consent: Option<bool>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InitializeResponse {
    pub initialized: bool,
}

// ============== Consent (UMP / GDPR) ==============

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestConsentRequest {
    #[serde(default)]
    pub tag_for_under_age_of_consent: Option<bool>,
    /// Debug-only geography override (1 = EEA, 2 = not EEA, …). Ignored by the SDK unless the
    /// device is listed in `test_device_hashed_ids`.
    #[serde(default)]
    pub debug_geography: Option<i32>,
    #[serde(default)]
    pub test_device_hashed_ids: Vec<String>,
    /// Debug-only: clear stored consent so the form is shown again.
    #[serde(default)]
    pub reset_consent: Option<bool>,
}

#[derive(Debug, Clone, Copy, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum ConsentStatus {
    #[default]
    Unknown,
    /// The user is outside a region that requires consent — no form will ever be shown.
    NotRequired,
    /// Consent is needed and has not been gathered yet.
    Required,
    Obtained,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ConsentResponse {
    pub status: ConsentStatus,
    /// The SDK's verdict on whether ads may be requested right now. Prefer this over `status`:
    /// it accounts for consent stored by earlier runs, and a user who *declined* personalization
    /// still gets `true` here (they receive non-personalized ads).
    pub can_request_ads: bool,
    /// Whether a "privacy options" entry point must be offered so the user can change their
    /// choice later. Only true in regions that require it.
    pub privacy_options_required: bool,
    /// Non-fatal problem (no network, form load failure). The other fields are still meaningful.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowPrivacyOptionsResponse {
    pub shown: bool,
    pub status: ConsentStatus,
    pub can_request_ads: bool,
    pub privacy_options_required: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

// ============== Banner Ads ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BannerAdOptions {
    pub ad_unit_id: String,
    #[serde(default = "default_banner_position")]
    pub position: BannerPosition,
    #[serde(default)]
    pub ad_size: BannerSize,
}

fn default_banner_position() -> BannerPosition {
    BannerPosition::Bottom
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum BannerPosition {
    Top,
    #[default]
    Bottom,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum BannerSize {
    #[default]
    Banner,
    LargeBanner,
    MediumRectangle,
    FullBanner,
    Leaderboard,
    Adaptive,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowBannerResponse {
    pub shown: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct HideBannerResponse {
    pub hidden: bool,
}

// ============== Interstitial Ads ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct InterstitialAdOptions {
    pub ad_unit_id: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareInterstitialResponse {
    pub loaded: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowInterstitialResponse {
    pub shown: bool,
}

// ============== Rewarded Ads ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RewardedAdOptions {
    pub ad_unit_id: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareRewardedResponse {
    pub loaded: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowRewardedResponse {
    pub shown: bool,
    pub reward: Option<AdReward>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdReward {
    pub reward_type: String,
    pub amount: i32,
}

// ============== Rewarded Interstitial Ads ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RewardedInterstitialAdOptions {
    pub ad_unit_id: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareRewardedInterstitialResponse {
    pub loaded: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowRewardedInterstitialResponse {
    pub shown: bool,
    pub reward: Option<AdReward>,
}

// ============== App Open Ads ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AppOpenAdOptions {
    pub ad_unit_id: String,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PrepareAppOpenResponse {
    pub loaded: bool,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ShowAppOpenResponse {
    pub shown: bool,
}

// ============== Ad Events ==============

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct AdEvent {
    pub ad_type: AdType,
    pub event: AdEventType,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reward: Option<AdReward>,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AdType {
    Banner,
    Interstitial,
    Rewarded,
    RewardedInterstitial,
    AppOpen,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum AdEventType {
    Loaded,
    FailedToLoad,
    Opened,
    Closed,
    Clicked,
    Impression,
    FailedToShow,
    Reward,
}

// ============== Legacy (keeping for compatibility) ==============

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingRequest {
    pub value: Option<String>,
}

#[derive(Debug, Clone, Default, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct PingResponse {
    pub value: Option<String>,
}
