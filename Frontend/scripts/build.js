import { build } from 'vite';

async function runBuild() {
  try {
    await build();
    // Clean exit once build promise resolves
    process.exit(0);
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

runBuild();
