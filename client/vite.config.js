import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Production build mein hardcoded localhost API URLs ko Render URL se badal deta hai
const replaceLocalhostApi = () => ({
  name: 'replace-localhost-api',
  apply: 'build',
  transform(code) {
    if (!code.includes('localhost:5000')) return null
    return {
      code: code
        .replace(/http:\/\/localhost:5000/g, 'https://occamart.onrender.com')
        .replace(/http:\/\/127\.0\.0\.1:5000/g, 'https://occamart.onrender.com'),
      map: null,
    }
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), replaceLocalhostApi()],
})
