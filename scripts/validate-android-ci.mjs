import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import YAML from 'yaml'

const rootDir = process.cwd()

const checks = []

/**
 * Records a validation result without stopping at the first failure.
 *
 * @param {boolean} condition condition that must be truthy
 * @param {string} message human-readable failure message
 */
function check(condition, message) {
  checks.push({ condition, message })
}

/**
 * Reads a UTF-8 text file from the project root.
 *
 * @param {string} relativePath path relative to the project root
 * @returns {string} file contents
 */
function readProjectFile(relativePath) {
  return readFileSync(path.join(rootDir, relativePath), 'utf8')
}

/**
 * Reads and parses package.json from the project root.
 *
 * @returns {Record<string, unknown>} parsed package metadata
 */
function readPackageJson() {
  return JSON.parse(readProjectFile('package.json'))
}

/**
 * Normalizes a GitHub Actions `run` value for substring checks.
 *
 * @param {unknown} value workflow step run value
 * @returns {string} normalized command string
 */
function normalizeRun(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * Returns true when any workflow step runs the expected command.
 *
 * @param {Array<Record<string, unknown>>} steps workflow steps
 * @param {string} command command substring to find
 * @returns {boolean} whether a matching run command exists
 */
function hasRunStep(steps, command) {
  return steps.some((step) => normalizeRun(step.run).includes(command))
}

/**
 * Returns true when any workflow step uses an action with the expected prefix.
 *
 * @param {Array<Record<string, unknown>>} steps workflow steps
 * @param {string} actionPrefix action prefix such as actions/checkout@
 * @returns {boolean} whether a matching action step exists
 */
function hasActionStep(steps, actionPrefix) {
  return steps.some((step) => String(step.uses ?? '').startsWith(actionPrefix))
}

/**
 * Returns true when an object has the requested own key.
 *
 * @param {Record<string, unknown>} value object to inspect
 * @param {string} key key that must be present
 * @returns {boolean} whether the key exists directly on the object
 */
function hasOwnKey(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key)
}

/**
 * Returns true when a workflow trigger ignores the requested path pattern.
 *
 * @param {unknown} trigger workflow trigger config
 * @param {string} pathPattern ignored path pattern to find
 * @returns {boolean} whether the trigger contains the ignore pattern
 */
function hasPathIgnore(trigger, pathPattern) {
  return Array.isArray(trigger?.['paths-ignore']) && trigger['paths-ignore'].includes(pathPattern)
}

const pkg = readPackageJson()
const scripts = pkg.scripts ?? {}
const dependencies = pkg.dependencies ?? {}
const devDependencies = pkg.devDependencies ?? {}

check(scripts['test:ci-config'] === 'node scripts/validate-android-ci.mjs', 'package.json must expose npm run test:ci-config')
check(Boolean(dependencies['@capacitor/core']), 'package.json must include @capacitor/core')
check(Boolean(dependencies['@capacitor/android']), 'package.json must include @capacitor/android')
check(Boolean(devDependencies['@capacitor/cli']), 'package.json must include @capacitor/cli as a dev dependency')

const capacitorConfigPath = path.join(rootDir, 'capacitor.config.ts')
check(existsSync(capacitorConfigPath), 'capacitor.config.ts must exist')

if (existsSync(capacitorConfigPath)) {
  const capacitorConfig = readProjectFile('capacitor.config.ts')
  check(capacitorConfig.includes("appId: 'com.seafocus.app'"), 'Capacitor appId must be com.seafocus.app')
  check(capacitorConfig.includes("appName: 'Sea Focus'"), 'Capacitor appName must be Sea Focus')
  check(capacitorConfig.includes("webDir: 'dist'"), 'Capacitor webDir must be dist')
}

check(existsSync(path.join(rootDir, 'android')), 'android platform directory must exist')
check(
  existsSync(path.join(rootDir, 'android', 'gradlew')) || existsSync(path.join(rootDir, 'android', 'gradlew.bat')),
  'android Gradle wrapper must exist',
)

const androidAppBuildPath = path.join(rootDir, 'android', 'app', 'build.gradle')
const androidStringsPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml')
const androidMainActivityPath = path.join(rootDir, 'android', 'app', 'src', 'main', 'java', 'com', 'seafocus', 'app', 'MainActivity.java')

if (existsSync(androidAppBuildPath)) {
  const androidAppBuild = readProjectFile('android/app/build.gradle')
  check(androidAppBuild.includes('namespace = "com.seafocus.app"'), 'Android namespace must be com.seafocus.app')
  check(androidAppBuild.includes('applicationId "com.seafocus.app"'), 'Android applicationId must be com.seafocus.app')
}

if (existsSync(androidStringsPath)) {
  const androidStrings = readProjectFile('android/app/src/main/res/values/strings.xml')
  check(androidStrings.includes('<string name="app_name">Sea Focus</string>'), 'Android app_name must be Sea Focus')
  check(androidStrings.includes('<string name="package_name">com.seafocus.app</string>'), 'Android package_name must be com.seafocus.app')
}

check(existsSync(androidMainActivityPath), 'Android MainActivity must live under com/seafocus/app')

for (const javaTestPath of [
  'android/app/src/androidTest/java/com/seafocus/app/ExampleInstrumentedTest.java',
  'android/app/src/test/java/com/seafocus/app/ExampleUnitTest.java',
]) {
  const absoluteJavaTestPath = path.join(rootDir, javaTestPath)
  check(existsSync(absoluteJavaTestPath), `${javaTestPath} must exist`)
  if (existsSync(absoluteJavaTestPath)) {
    const javaTest = readProjectFile(javaTestPath)
    check(!javaTest.includes('com.getcapacitor.myapp'), `${javaTestPath} must not use the Capacitor template package`)
  }
}

const workflowRelativePath = '.github/workflows/android-apk.yml'
const workflowPath = path.join(rootDir, workflowRelativePath)
check(existsSync(workflowPath), `${workflowRelativePath} must exist`)

if (existsSync(workflowPath)) {
  const workflow = YAML.parse(readProjectFile(workflowRelativePath))
  const triggers = workflow?.on ?? {}
  const jobs = workflow?.jobs ?? {}
  const androidJob = jobs['android-release-apk']
  const steps = Array.isArray(androidJob?.steps) ? androidJob.steps : []

  check(hasOwnKey(triggers, 'push'), 'workflow must run on push')
  check(hasOwnKey(triggers, 'pull_request'), 'workflow must run on pull_request')
  check(hasOwnKey(triggers, 'workflow_dispatch'), 'workflow must support workflow_dispatch')
  check(hasPathIgnore(triggers.push, 'docs/**'), 'workflow push trigger must ignore docs/** changes')
  check(hasPathIgnore(triggers.pull_request, 'docs/**'), 'workflow pull_request trigger must ignore docs/** changes')
  check(androidJob?.['runs-on'] === 'ubuntu-24.04', 'android-release-apk job must run on ubuntu-24.04')
  check(hasActionStep(steps, 'actions/checkout@'), 'workflow must checkout the repository')
  check(hasActionStep(steps, 'actions/setup-node@'), 'workflow must set up Node.js')
  check(hasActionStep(steps, 'actions/setup-java@'), 'workflow must set up Java')
  check(hasRunStep(steps, 'npm ci'), 'workflow must install dependencies with npm ci')
  check(hasRunStep(steps, 'npm run lint'), 'workflow must run lint')
  check(hasRunStep(steps, 'npm run test:unit'), 'workflow must run unit tests')
  check(hasRunStep(steps, 'npm run test:ci-config'), 'workflow must run CI config validation')
  check(hasRunStep(steps, 'npm run build'), 'workflow must build the Vite app')
  check(hasRunStep(steps, 'npx cap sync android'), 'workflow must sync Capacitor Android assets')
  check(hasRunStep(steps, 'SDKMANAGER='), 'workflow must resolve sdkmanager from ANDROID_HOME')
  check(hasRunStep(steps, '"$SDKMANAGER" "platforms;android-36" "build-tools;36.0.0"'), 'workflow must ensure Android SDK 36 build components through resolved sdkmanager')
  check(hasRunStep(steps, 'RELEASE_KEYSTORE_BASE64'), 'workflow must support release keystore secrets')
  check(hasRunStep(steps, 'keytool -genkeypair'), 'workflow must create a CI release signing key')
  check(hasRunStep(steps, './gradlew assembleRelease'), 'workflow must build the Android release APK')
  check(hasRunStep(steps, 'android.injected.signing.store.file'), 'workflow must inject signing config for the release APK')
  check(!hasRunStep(steps, './gradlew assembleDebug'), 'workflow must not build the Android debug APK')
  check(
    steps.some((step) => step.uses === 'actions/upload-artifact@v4' && step.with?.name === 'sea-focus-release-apk'),
    'workflow must upload the sea-focus-release-apk artifact',
  )
  check(
    steps.some((step) => step.uses === 'actions/upload-artifact@v4' && String(step.with?.path ?? '').includes('outputs/apk/release')),
    'workflow must upload release APK outputs',
  )
  check(
    !steps.some((step) => step.uses === 'actions/upload-artifact@v4' && String(step.with?.path ?? '').includes('outputs/apk/debug')),
    'workflow must not upload debug APK outputs',
  )
}

const failedChecks = checks.filter((item) => !item.condition)

if (failedChecks.length > 0) {
  console.error('Android CI validation failed:')
  for (const failedCheck of failedChecks) {
    console.error(`- ${failedCheck.message}`)
  }
  process.exit(1)
}

console.log(`Android CI validation passed (${checks.length} checks).`)
