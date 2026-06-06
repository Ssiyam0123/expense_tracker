const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure correct JDK and Android SDK paths are set on Windows
process.env.JAVA_HOME = process.env.JAVA_HOME || 'C:\\Program Files\\Android\\Android Studio\\jbr';
process.env.ANDROID_HOME = process.env.ANDROID_HOME || 'C:\\Users\\ssiya\\AppData\\Local\\Android\\Sdk';

const sourceDir = path.resolve(__dirname, '..');
const targetDir = 'D:\\expense-tracker-mobile';

console.log('🔄 Syncing source changes to build directory...');
console.log(`Source: ${sourceDir}`);
console.log(`Target: ${targetDir}`);

function copyRecursive(src, dest) {
  const relative = path.relative(sourceDir, src);
  if (relative) {
    const parts = relative.split(path.sep);
    const excludeList = ['node_modules', 'android', '.expo', '.kotlin', 'build', '.git', '.gradle'];
    if (parts.some(part => excludeList.includes(part))) {
      return;
    }
  }

  let stats;
  try {
    stats = fs.lstatSync(src);
  } catch (err) {
    console.warn(`⚠️ Warning: Could not stat file/directory ${relative || 'root'}: ${err.message}`);
    return;
  }

  if (stats.isSymbolicLink()) {
    return;
  }

  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      try {
        fs.mkdirSync(dest, { recursive: true });
      } catch (err) {
        console.error(`❌ Failed to create directory ${dest}: ${err.message}`);
        return;
      }
    }
    let files;
    try {
      files = fs.readdirSync(src);
    } catch (err) {
      console.warn(`⚠️ Warning: Could not read directory ${relative}: ${err.message}`);
      return;
    }
    for (const file of files) {
      copyRecursive(path.join(src, file), path.join(dest, file));
    }
  } else if (stats.isFile()) {
    try {
      fs.copyFileSync(src, dest);
    } catch (err) {
      console.warn(`⚠️ Warning: Failed to copy file ${relative}: ${err.message}`);
    }
  }
}

// Sync files recursively
copyRecursive(sourceDir, targetDir);
console.log('✅ Sync completed.');

// Check build type argument
const buildType = process.argv[2] || 'all'; // 'apk', 'aab', 'all'
const buildDir = path.join(targetDir, 'android');

if (!fs.existsSync(path.join(targetDir, 'node_modules'))) {
  console.log('📦 Installing dependencies in build directory...');
  try {
    execSync('npm install', {
      cwd: targetDir,
      stdio: 'inherit'
    });
  } catch (err) {
    console.error('❌ Failed to install dependencies:', err.message);
    process.exit(1);
  }
}

if (!fs.existsSync(buildDir)) {
  console.log('🏗️ Android native folder not found. Re-generating using expo prebuild...');
  try {
    execSync('npx expo prebuild --platform android --no-install', {
      cwd: targetDir,
      stdio: 'inherit'
    });
  } catch (err) {
    console.error('❌ Expo prebuild failed:', err.message);
    process.exit(1);
  }
}

function copyIfExists(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Sync release signing configurations if they exist
copyIfExists(
  path.join(sourceDir, 'android/app/build.gradle'),
  path.join(buildDir, 'app/build.gradle')
);
copyIfExists(
  path.join(sourceDir, 'android/gradle.properties'),
  path.join(buildDir, 'gradle.properties')
);
copyIfExists(
  path.join(sourceDir, 'android/keystore.properties'),
  path.join(buildDir, 'keystore.properties')
);
copyIfExists(
  path.join(sourceDir, 'android/app/upload-keystore.jks'),
  path.join(buildDir, 'app/upload-keystore.jks')
);

// Compile
try {
  // 1. Enable Minify and Shrink Resources in gradle.properties
  const gradlePropertiesPath = path.join(buildDir, 'gradle.properties');
  if (fs.existsSync(gradlePropertiesPath)) {
    console.log('⚡ Enabling Minification and Resource Shrinking in gradle.properties...');
    let gradleProps = fs.readFileSync(gradlePropertiesPath, 'utf8');
    gradleProps += '\nandroid.enableMinifyInReleaseBuilds=true\n';
    gradleProps += 'android.enableShrinkResourcesInReleaseBuilds=true\n';
    fs.writeFileSync(gradlePropertiesPath, gradleProps, 'utf8');
  }

  // 2. Enable ABI splits (only build for modern arm64-v8a) in app/build.gradle
  const buildGradlePath = path.join(buildDir, 'app/build.gradle');
  if (fs.existsSync(buildGradlePath)) {
    console.log('⚡ Configuring ABI splits and filters to target modern 64-bit devices (arm64-v8a only)...');
    let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
    
    const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk false
            include "arm64-v8a"
        }
    }
    `;
    
    const ndkBlock = `
        ndk {
            abiFilters "arm64-v8a"
        }
    `;
    
    buildGradle = buildGradle.replace('android {', 'android {\n' + splitsBlock);
    buildGradle = buildGradle.replace('defaultConfig {', 'defaultConfig {\n' + ndkBlock);
    fs.writeFileSync(buildGradlePath, buildGradle, 'utf8');
  }

  if (buildType === 'apk' || buildType === 'all') {
    console.log('🚀 Compiling APK (assembleRelease)...');
    execSync('.\\gradlew.bat assembleRelease', {
      cwd: buildDir,
      stdio: 'inherit'
    });
    console.log('✅ APK compiled successfully.');
    
    // Copy APK back to workspace
    const apkDir = path.join(buildDir, 'app/build/outputs/apk/release');
    const files = fs.readdirSync(apkDir);
    const apkFile = files.find(f => f.endsWith('.apk'));
    if (apkFile) {
      const apkSource = path.join(apkDir, apkFile);
      const apkDest = path.resolve(sourceDir, '../builds/app-release.apk');
      fs.mkdirSync(path.dirname(apkDest), { recursive: true });
      fs.copyFileSync(apkSource, apkDest);
      console.log(`💾 Saved APK to: ${apkDest}`);
    } else {
      console.error('❌ Could not find compiled APK file.');
    }
  }

  if (buildType === 'aab' || buildType === 'all') {
    console.log('🚀 Compiling AAB Bundle (bundleRelease)...');
    execSync('.\\gradlew.bat bundleRelease', {
      cwd: buildDir,
      stdio: 'inherit'
    });
    console.log('✅ AAB Bundle compiled successfully.');
    
    // Copy AAB back to workspace
    const aabSource = path.join(buildDir, 'app/build/outputs/bundle/release/app-release.aab');
    const aabDest = path.resolve(sourceDir, '../builds/app-release.aab');
    fs.mkdirSync(path.dirname(aabDest), { recursive: true });
    fs.copyFileSync(aabSource, aabDest);
    console.log(`💾 Saved AAB to: ${aabDest}`);
  }
  
  console.log('\n🎉 Local build process finished successfully!');
} catch (err) {
  console.error('\n❌ Build execution failed. See output details above.');
  process.exit(1);
}
