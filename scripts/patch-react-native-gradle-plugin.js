const fs = require('node:fs');
const path = require('node:path');

const target = path.join(
  __dirname,
  '..',
  'node_modules',
  '@react-native',
  'gradle-plugin',
  'settings.gradle.kts'
);

if (!fs.existsSync(target)) {
  process.exit(0);
}

const source = fs.readFileSync(target, 'utf8');
const from = 'id("org.gradle.toolchains.foojay-resolver-convention").version("0.5.0")';
const to = 'id("org.gradle.toolchains.foojay-resolver-convention").version("1.0.0")';

if (source.includes(to)) {
  process.exit(0);
}

if (!source.includes(from)) {
  throw new Error(`Unexpected React Native Gradle plugin settings format: ${target}`);
}

fs.writeFileSync(target, source.replace(from, to));
