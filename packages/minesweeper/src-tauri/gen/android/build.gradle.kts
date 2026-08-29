buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        // Bumped from tauri's default 1.9.25 because the vendored AdMob plugin's Kotlin source
        // uses 2.x syntax. This version also caps how new play-services-ads can go: 25.3.0+ ship
        // .kotlin_module metadata at binary version 2.3.0, which a 2.1.x compiler refuses to read
        // ("Module was compiled with an incompatible version of Kotlin"). Moving the ads SDK past
        // 25.2.0 means bumping this to 2.3+ at the same time. Kept in step with the cube app.
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:2.1.20")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

