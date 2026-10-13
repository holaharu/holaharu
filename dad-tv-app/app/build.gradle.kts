plugins { id("com.android.application") }
android {
 namespace = "com.haru.dadtv"
 compileSdk = 35
 defaultConfig { applicationId = "com.haru.dadtv"; minSdk = 26; targetSdk = 35; versionCode = 1; versionName = "0.1" }
 compileOptions { sourceCompatibility = JavaVersion.VERSION_17; targetCompatibility = JavaVersion.VERSION_17 }
}
