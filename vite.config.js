import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
plugins: [react()],
server: {
proxy: {
'/api': {
target: 'https://laplano-mean.onrender.com',
changeOrigin: true
}
}
}
})
