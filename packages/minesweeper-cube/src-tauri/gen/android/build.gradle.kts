buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        // Bumped from tauri's default 1.9.25 → 2.1.20; the admob plugin's Kotlin source needs 2.x
        // syntax. This version also caps how new play-services-ads can go: 25.3.0+ ship
        // .kotlin_module metadata at binary version 2.3.0, which a 2.1.x compiler refuses to read
        // ("Module was compiled with an incompatible version of Kotlin"). Going to ads 25.4.0
        // means bumping this to 2.3+ (2.4.10 is current stable) at the same time.
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

