# Sea Focus

Sea Focus is an Android-targeted tomato planning app built with React, Vite, Tailwind CSS, and Capacitor.

## Local Development

Prerequisites:

- Node.js 22 or newer
- npm

Run the web app locally:

```bash
npm install
npm run dev
```

Validate the project:

```bash
npm run lint
npm run test:unit
npm run build
npm run test:ci-config
```

## Android APK

The Android wrapper is powered by Capacitor. After dependencies are installed, sync web assets into Android with:

```bash
npm run android:sync
```

GitHub Actions builds the debug APK on every push, pull request, and manual workflow run. After a workflow finishes, open the run in GitHub Actions and download the `sea-focus-debug-apk` artifact.

The debug APK is for testing. Release signing and Play Store publishing should be added later with a keystore stored in GitHub Secrets.
