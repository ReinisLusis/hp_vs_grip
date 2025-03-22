import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Custom plugin to inline everything
function inlinePlugin() {
  return {
    name: 'vite:inline',
    enforce: 'post',
    generateBundle(options, bundle) {
      let htmlFile = Object.values(bundle).find(file => file.type === 'asset' && file.fileName === 'index.html')
      let jsFiles = Object.values(bundle).filter(file => file.type === 'chunk' && file.fileName.endsWith('.js'))
      let cssFile = Object.values(bundle).find(file => file.fileName.endsWith('.css'))

      if (htmlFile && jsFiles.length && cssFile) {
        // Combine all JS files and convert to data URL
        const combinedJs = jsFiles
          .map(file => file.code)
          .join('\n')
        
        const jsDataUrl = `data:text/javascript;base64,${Buffer.from(combinedJs).toString('base64')}`

        // Create a new HTML structure
        htmlFile.source = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Car Performance Calculator</title>
    <style>${cssFile.source}</style>
  </head>
  <body>
    <div id="root"></div>
    <script src="${jsDataUrl}"></script>
  </body>
</html>
`
        // Remove other files from bundle
        for (const fileName in bundle) {
          if (fileName !== 'index.html') {
            delete bundle[fileName]
          }
        }
      }
    }
  }
}

export default defineConfig({
  plugins: [react(), inlinePlugin()],
  build: {
    rollupOptions: {
      output: {
        inlineDynamicImports: true
      }
    },
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    outDir: 'dist',
    emptyOutDir: true,
    minify: 'terser'
  },
  server: {
    port: 5174
  }
}) 