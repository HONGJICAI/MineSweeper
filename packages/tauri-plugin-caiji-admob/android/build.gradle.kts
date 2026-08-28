plugins {
    id("com.android.library")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.plugin.google_admob"
    compileSdk = 36

    defaultConfig {
        // Matches the games' app-level minSdk (see packages/*/src-tauri/gen/android/app/
        // build.gradle.kts). Upstream had 23; GMA 25.x targets 24+ and a library minSdk below the
        // app's buys us nothing here.
        minSdk = 24

        consumerProguardFiles("consumer-rules.pro")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }
    kotlinOptions {
        jvmTarget = "1.8"
    }
}

dependencies {
    // androidx/material versions aligned with the app module so gradle's "highest wins" conflict
    // resolution has nothing to resolve. Upstream pinned older ones (1.9.0/1.6.0/1.7.0/2.8.3).
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.appcompat:appcompat:1.7.1")
    implementation("com.google.android.material:material:1.12.0")
    // Google Mobile Ads SDK. Upstream shipped 24.9.0. 25.4.0 is the newest but its .kotlin_module
    // metadata is binary version 2.3.0, which needs a Kotlin 2.3+ compiler; 25.2.0 is the newest
    // release that still builds with the Kotlin 2.1.20 toolchain in gen/android/build.gradle.kts.
    // Bump both together when moving past this.
    implementation("com.google.android.gms:play-services-ads:25.2.0")
    // UMP (consent) SDK. play-services-ads already pulls this in transitively, but we call it
    // directly in AdmobPlugin.kt so it gets declared directly — a transitive dep is not a
    // contract. 4.0.0 is current.
    implementation("com.google.android.ump:user-messaging-platform:4.0.0")
    implementation("androidx.lifecycle:lifecycle-process:2.10.0")
    // No test source sets: upstream shipped only Android Studio's sample tests, and those did not
    // even compile (`package com.plugin.google-admob` — a hyphen is not legal in a Kotlin package
    // name, which nothing caught because assembleDebug/Release skips test source sets). They were
    // deleted rather than fixed; `2 + 2 == 4` was not worth keeping. Add junit back here if real
    // tests ever land — note CI does not currently run any gradle test task.
    implementation(project(":tauri-android"))
}
