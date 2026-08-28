import { invoke } from '@tauri-apps/api/core'

// ============== Types ==============

export interface InitializeOptions {
  testDeviceIds?: string[]
  tagForChildDirectedTreatment?: boolean
  tagForUnderAgeOfConsent?: boolean
}

export interface InitializeResult {
  initialized: boolean
}

// ============== Consent (UMP / GDPR) ==============

export interface RequestConsentOptions {
  tagForUnderAgeOfConsent?: boolean
  /**
   * Debug-only geography override: 1 = EEA, 2 = not EEA. Only honoured for devices listed in
   * `testDeviceHashedIds` — on a real user's device the SDK ignores it. Get the hashed id from
   * logcat: the UMP SDK prints it when it runs on a debug build.
   */
  debugGeography?: number
  testDeviceHashedIds?: string[]
  /** Debug-only: clear stored consent so the form appears again. */
  resetConsent?: boolean
}

/**
 * - `notRequired` — user is outside a region that requires consent; no form is ever shown.
 * - `required` — consent is needed and has not been gathered.
 * - `obtained` — the user has been through the form.
 */
export type ConsentStatus = 'unknown' | 'notRequired' | 'required' | 'obtained'

export interface ConsentResult {
  status: ConsentStatus
  /**
   * Whether ads may be requested right now. Prefer this over `status`: it accounts for consent
   * stored on previous runs, and a user who *declined* personalization is still `true` here —
   * they get non-personalized ads rather than no ads.
   */
  canRequestAds: boolean
  /** True only where a "privacy options" entry point is legally required. Gate any UI on this. */
  privacyOptionsRequired: boolean
  /** Non-fatal problem (offline, form failed to load). The other fields still apply. */
  error?: string
}

export interface ShowPrivacyOptionsResult extends ConsentResult {
  shown: boolean
}

/**
 * Run the UMP consent flow. MUST be awaited before `initialize()` — the ads SDK has to come up
 * knowing the consent state. Resolves (never rejects) on network failure so a user who consented
 * earlier isn't locked out of ads by a bad cold start; check `error` if you care.
 */
export async function requestConsent(
  options: RequestConsentOptions = {}
): Promise<ConsentResult> {
  return await invoke<ConsentResult>('plugin:caiji-admob|request_consent', {
    payload: options,
  })
}

/** Read the stored consent state without showing any UI. */
export async function getConsentStatus(): Promise<ConsentResult> {
  return await invoke<ConsentResult>('plugin:caiji-admob|get_consent_status')
}

/**
 * Re-open the consent form so the user can change their choice. Only call when
 * `privacyOptionsRequired` is true — elsewhere there is no form to show.
 */
export async function showPrivacyOptionsForm(): Promise<ShowPrivacyOptionsResult> {
  return await invoke<ShowPrivacyOptionsResult>(
    'plugin:caiji-admob|show_privacy_options_form'
  )
}

export type BannerPosition = 'top' | 'bottom'

export type BannerSize =
  | 'BANNER'
  | 'LARGE_BANNER'
  | 'MEDIUM_RECTANGLE'
  | 'FULL_BANNER'
  | 'LEADERBOARD'
  | 'ADAPTIVE'

export interface BannerAdOptions {
  adUnitId: string
  position?: BannerPosition
  adSize?: BannerSize
}

export interface ShowBannerResult {
  shown: boolean
}

export interface HideBannerResult {
  hidden: boolean
}

export interface InterstitialAdOptions {
  adUnitId: string
}

export interface PrepareInterstitialResult {
  loaded: boolean
}

export interface ShowInterstitialResult {
  shown: boolean
}

export interface RewardedAdOptions {
  adUnitId: string
}

export interface PrepareRewardedResult {
  loaded: boolean
}

export interface AdReward {
  rewardType: string
  amount: number
}

export interface ShowRewardedResult {
  shown: boolean
  reward?: AdReward
}

export interface RewardedInterstitialAdOptions {
  adUnitId: string
}

export interface PrepareRewardedInterstitialResult {
  loaded: boolean
}

export interface ShowRewardedInterstitialResult {
  shown: boolean
  reward?: AdReward
}

export interface AppOpenAdOptions {
  adUnitId: string
}

export interface PrepareAppOpenResult {
  loaded: boolean
}

export interface ShowAppOpenResult {
  shown: boolean
}

export type AdType =
  | 'banner'
  | 'interstitial'
  | 'rewarded'
  | 'rewardedInterstitial'
  | 'appOpen'

export type AdEventType =
  | 'loaded'
  | 'failedToLoad'
  | 'opened'
  | 'closed'
  | 'clicked'
  | 'impression'
  | 'failedToShow'
  | 'reward'

export interface AdEvent {
  adType: AdType
  event: AdEventType
  error?: string
  reward?: AdReward
}

// ============== Test Ad Unit IDs ==============

export const TestAdUnitIds = {
  BANNER: 'ca-app-pub-3940256099942544/9214589741',
  INTERSTITIAL: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: 'ca-app-pub-3940256099942544/5224354917',
  REWARDED_INTERSTITIAL: 'ca-app-pub-3940256099942544/5354046379',
  APP_OPEN: 'ca-app-pub-3940256099942544/9257395921',
} as const

// ============== Initialize ==============

/**
 * Initialize the AdMob SDK
 * @param options - Initialization options including test device IDs
 * @returns Promise resolving to initialization result
 */
export async function initialize(
  options: InitializeOptions = {}
): Promise<InitializeResult> {
  return await invoke<InitializeResult>('plugin:caiji-admob|initialize', {
    payload: options,
  })
}

// ============== Banner Ads ==============

/**
 * Show a banner ad
 * @param options - Banner ad options including ad unit ID, position, and size
 * @returns Promise resolving when banner is shown
 */
export async function showBanner(
  options: BannerAdOptions
): Promise<ShowBannerResult> {
  return await invoke<ShowBannerResult>('plugin:caiji-admob|show_banner', {
    payload: {
      adUnitId: options.adUnitId,
      position: options.position ?? 'bottom',
      adSize: options.adSize ?? 'BANNER',
    },
  })
}

/**
 * Hide the currently showing banner ad
 * @returns Promise resolving when banner is hidden
 */
export async function hideBanner(): Promise<HideBannerResult> {
  return await invoke<HideBannerResult>('plugin:caiji-admob|hide_banner')
}

// ============== Interstitial Ads ==============

/**
 * Prepare (load) an interstitial ad
 * @param options - Interstitial ad options including ad unit ID
 * @returns Promise resolving when ad is loaded
 */
export async function prepareInterstitial(
  options: InterstitialAdOptions
): Promise<PrepareInterstitialResult> {
  return await invoke<PrepareInterstitialResult>(
    'plugin:caiji-admob|prepare_interstitial',
    {
      payload: options,
    }
  )
}

/**
 * Show a prepared interstitial ad
 * @returns Promise resolving when ad is shown
 */
export async function showInterstitial(): Promise<ShowInterstitialResult> {
  return await invoke<ShowInterstitialResult>(
    'plugin:caiji-admob|show_interstitial'
  )
}

// ============== Rewarded Ads ==============

/**
 * Prepare (load) a rewarded ad
 * @param options - Rewarded ad options including ad unit ID
 * @returns Promise resolving when ad is loaded
 */
export async function prepareRewarded(
  options: RewardedAdOptions
): Promise<PrepareRewardedResult> {
  return await invoke<PrepareRewardedResult>(
    'plugin:caiji-admob|prepare_rewarded',
    {
      payload: options,
    }
  )
}

/**
 * Show a prepared rewarded ad
 * @returns Promise resolving with reward information when ad is completed
 */
export async function showRewarded(): Promise<ShowRewardedResult> {
  return await invoke<ShowRewardedResult>('plugin:caiji-admob|show_rewarded')
}

// ============== Rewarded Interstitial Ads ==============

/**
 * Prepare (load) a rewarded interstitial ad
 * @param options - Rewarded interstitial ad options including ad unit ID
 * @returns Promise resolving when ad is loaded
 */
export async function prepareRewardedInterstitial(
  options: RewardedInterstitialAdOptions
): Promise<PrepareRewardedInterstitialResult> {
  return await invoke<PrepareRewardedInterstitialResult>(
    'plugin:caiji-admob|prepare_rewarded_interstitial',
    {
      payload: options,
    }
  )
}

/**
 * Show a prepared rewarded interstitial ad
 * @returns Promise resolving with reward information when ad is completed
 */
export async function showRewardedInterstitial(): Promise<ShowRewardedInterstitialResult> {
  return await invoke<ShowRewardedInterstitialResult>(
    'plugin:caiji-admob|show_rewarded_interstitial'
  )
}

// ============== App Open Ads ==============

/**
 * Prepare (load) an app open ad
 * @param options - App open ad options including ad unit ID
 * @returns Promise resolving when ad is loaded
 */
export async function prepareAppOpen(
  options: AppOpenAdOptions
): Promise<PrepareAppOpenResult> {
  return await invoke<PrepareAppOpenResult>(
    'plugin:caiji-admob|prepare_app_open',
    {
      payload: options,
    }
  )
}

/**
 * Show a prepared app open ad
 * @returns Promise resolving when ad is shown
 */
export async function showAppOpen(): Promise<ShowAppOpenResult> {
  return await invoke<ShowAppOpenResult>('plugin:caiji-admob|show_app_open')
}

// ============== Legacy (keeping for compatibility) ==============

export async function ping(value: string): Promise<string | null> {
  return await invoke<{ value?: string }>('plugin:caiji-admob|ping', {
    payload: {
      value,
    },
  }).then((r) => (r.value ? r.value : null))
}
