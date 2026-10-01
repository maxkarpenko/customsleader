import {defineConfig} from 'vite';

// Two pages: the landing (index.html) and the 3D on/off switch (3d.html).
export default defineConfig({
  // Repository pages are served below /<repository>/; local development stays at /.
  base:process.env.GITHUB_ACTIONS?`/${process.env.GITHUB_REPOSITORY.split('/')[1]}/`:'/',
  build:{rollupOptions:{input:{main:'index.html',scenes:'3d.html'}}},
});
