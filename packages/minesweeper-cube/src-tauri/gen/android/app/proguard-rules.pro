# AdMob / Play Services Ads — keep all public API so R8 doesn't strip the SDK.
# The AAR ships its own consumer-proguard-rules, but restating them here guards
# against edge cases where the consumer rules aren't picked up (e.g. local AAR
# vs. remote Maven).
-keep class com.google.android.gms.ads.** { *; }
-keep class com.google.android.gms.common.** { *; }
-dontwarn com.google.android.gms.**

# Tauri JNI bridge — classes with native methods must not be renamed or removed;
# the Rust .so resolves them by mangled class+method name at load time.
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Keep the Tauri plugin entry-point classes that the Android runtime looks up by name.
-keep class app.tauri.** { *; }
