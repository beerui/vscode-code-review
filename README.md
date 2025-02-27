import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          // 兼容 Webview 的 DOM 限制
          isCustomElement: (tag) => tag.startsWith('vscode-')
        }
      }
    })
  ],

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@webview': path.resolve(__dirname, './src/webview/src')
    }
  },

  build: {
    outDir: 'out/webview',
    emptyOutDir: true,
    assetsInlineLimit: 0, // 强制所有资源保持文件形式
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, './src/webview/index.html')
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
})

import { createApp } from 'vue'
import App from '@/App.vue'

// 获取 VS Code API 实例
const vscode = acquireVsCodeApi()

createApp(App, { 
  vscode: vscode 
}).mount('#app')

<template>
  <div class="webview-container">
    <h1>{{ msg }}</h1>
    <button @click="handleClick">通知插件</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// 接收来自插件的数据
const props = defineProps<{
  vscode: any
  initialData: string
}>()

const msg = ref(props.initialData || 'Hello Vite + Vue!')

const handleClick = () => {
  props.vscode.postMessage({
    command: 'vue-event',
    text: 'From Vue Webview'
  })
}
</script>

<style scoped>
.webview-container {
  padding: 20px;
}
</style>



// src/extension.ts
import * as vscode from 'vscode'
import path from 'path'

export function activate(context: vscode.ExtensionContext) {
  // 开发模式下启动 Vite 服务器
  let viteServer: any
  if (context.extensionMode === vscode.ExtensionMode.Development) {
    import('vite').then(({ createServer }) => {
      createServer({
        configFile: path.resolve(__dirname, '../vite.config.ts'),
        root: path.resolve(__dirname, '../src/webview')
      }).then(server => {
        viteServer = server
        server.listen(3000)
      })
    })
  }

  // 注册命令
  context.subscriptions.push(
    vscode.commands.registerCommand('extension.showVueWebview', () => {
      const panel = vscode.window.createWebviewPanel(
        'vueWebview',
        'Vue Webview',
        vscode.ViewColumn.One,
        {
          enableScripts: true,
          retainContextWhenHidden: true,
          localResourceRoots: [
            vscode.Uri.file(path.join(context.extensionPath, 'out/webview'))
          ]
        }
      )

      // 动态生成资源路径
      const getUri = (filePath: string) => {
        if (context.extensionMode === vscode.ExtensionMode.Development) {
          return `http://localhost:3000/${filePath}`
        }
        return panel.webview.asWebviewUri(
          vscode.Uri.file(path.join(context.extensionPath, 'out/webview', filePath))
        ).toString()
      }

      // 构建 HTML 内容
      panel.webview.html = `
        <!DOCTYPE html>
        <html>
          <head>
            <script type="module" src="${getUri('src/main.ts')}"></script>
          </head>
          <body>
            <div id="app" data-initial="${JSON.stringify({ initialData: '来自插件的数据' })"></div>
          </body>
        </html>
      `

      // 处理 Webview 消息
      panel.webview.onDidReceiveMessage(message => {
        if (message.command === 'vue-event') {
          vscode.window.showInformationMessage(`收到 Vue 消息: ${message.text}`)
        }
      })
    })
  )

  // 关闭时清理资源
  context.subscriptions.push({
    dispose: () => {
      if (viteServer) {
        viteServer.close()
      }
    }
  })
}





// vite.config.ts
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: 'src/webview/public/*',
          dest: ''
        }
      ]
    })
  ]
})



// vite.config.ts
export default defineConfig({
  css: {
    postcss: {
      plugins: [
        require('postcss-nested')
      ]
    }
  }
})




{
  "scripts": {
    "dev": "NODE_ENV=development tsc -w & vite build --watch",
    "build": "tsc && vite build",
    "package": "vsce package --yarn"
  }
}




declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// VS Code API 类型扩展
interface Window {
  acquireVsCodeApi: () => any
}


{
  "compilerOptions": {
    "types": ["vite/client", "node"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@webview/*": ["src/webview/src/*"]
    }
  }
}




{
  "configurations": [
    {
      "type": "extensionHost",
      "request": "launch",
      "runtimeExecutable": "${execPath}",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--enable-proposed-api=your.extension"
      ],
      "env": {
        "VITE_MODE": "development"
      }
    }
  ]
}
