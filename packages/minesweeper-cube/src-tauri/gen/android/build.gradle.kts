buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        // Bumped from tauri's default 1.9.25 → 2.1.20. tauri-plugin-admob-android's own Kotlin
        // source uses 2.x syntax — without this the plugin's compileReleaseKotlin fails with
        // a generic "Compilation error". Version comes from the plugin's README.
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

