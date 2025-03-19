// extension.ts
vscode.window.registerWebviewPanelSerializer('codeReviewView', {
  async deserializeWebviewPanel(panel: vscode.WebviewPanel) {
    // 消息监听处理
    panel.webview.onDidReceiveMessage(async (message: VSMessage) => {
      switch (message.command) {
        case 'FETCH_DATA':
          const data = await fetchFromDB(message.payload.query)
          panel.webview.postMessage({
            correlationId: message.correlationId,
            payload: data
          })
          break;
        case 'RUN_COMMAND':
          await executeAnalysis(message.payload.target)
          break;
      }
    }, undefined, context.subscriptions)
  }
})



<!-- src/webviews/components/CodeReview.vue -->
<template>
  <div>
    <button @click="loadData">加载数据</button>
    <p>最新消息：{{ latestMessage }}</p>
    <p v-if="error">错误：{{ error.message }}</p>
  </div>
</template>

<script setup lang="ts">
import { useVSCodeBridge } from '@/utils/vscode-bridge'

const { post, latestMessage, error, fetchData } = useVSCodeBridge()

const loadData = async () => {
  try {
    // 使用快捷方法
    const result = await fetchData<{ items: string[] }>({ 
      query: 'code-review-list' 
    })
    console.log('Received:', result.items)
    
    // 或使用通用post方法
    await post('RUN_COMMAND', { 
      type: 'analysis', 
      target: 'currentFile' 
    })
  } catch (err) {
    error.value = err as Error
  }
}
</script>



// src/webviews/utils/vscode-bridge.ts
import { onMounted, onUnmounted, ref, type Ref } from 'vue'

// 1. 定义严格类型体系
type MessageCommand = 
  | 'FETCH_DATA' 
  | 'SAVE_DATA'
  | 'RUN_COMMAND'
  | 'LOG_ACTION'

interface VSMessage<T = any> {
  command: MessageCommand
  payload?: T
  correlationId?: string  // 用于请求响应匹配
}

type CallbackFunction<T = any> = (response: T) => void

// 2. 获取VSCode API单例
const vscode = typeof acquireVsCodeApi !== 'undefined' ? 
  acquireVsCodeApi() : 
  { postMessage: (msg: any) => console.log('Mock post:', msg) }

// 3. 创建响应式通信桥接器
export function useVSCodeBridge() {
  const pendingRequests = new Map<string, CallbackFunction>()
  const latestMessage: Ref<any> = ref(null)
  const error = ref<Error | null>(null)

  // 4. 消息发送器（支持Promise和回调两种模式）
  const post = <T = any, R = any>(
    command: MessageCommand,
    payload?: T,
    timeout = 3000
  ): Promise<R> => {
    return new Promise((resolve, reject) => {
      const correlationId = `${command}_${Date.now()}_${Math.random().toString(16).slice(2)}`
      
      // 超时处理
      const timer = setTimeout(() => {
        pendingRequests.delete(correlationId)
        reject(new Error(`Request timeout after ${timeout}ms`))
      }, timeout)

      // 注册回调
      pendingRequests.set(correlationId, (response: R) => {
        clearTimeout(timer)
        resolve(response)
      })

      // 发送消息
      try {
        vscode.postMessage({
          command,
          payload,
          correlationId
        } as VSMessage<T>)
      } catch (err) {
        reject(err)
      }
    })
  }

  // 5. 消息接收处理器
  const messageHandler = (event: MessageEvent<VSMessage>) => {
    const { data } = event
    latestMessage.value = data

    if (data.correlationId && pendingRequests.has(data.correlationId)) {
      const callback = pendingRequests.get(data.correlationId)!
      callback(data.payload)
      pendingRequests.delete(data.correlationId)
    }
  }

  // 6. 生命周期管理
  onMounted(() => {
    window.addEventListener('message', messageHandler)
  })

  onUnmounted(() => {
    window.removeEventListener('message', messageHandler)
    pendingRequests.clear()
  })

  return { 
    post,
    latestMessage,
    error,
    // 支持快捷方法
    fetchData: <T = any>(query: any) => post<T>('FETCH_DATA', query),
    saveData: <T = any>(data: any) => post<T>('SAVE_DATA', data)
  }
}

// 7. 类型增强声明
declare global {
  interface Window {
    acquireVsCodeApi: () => VSCodeAPI
  }
}
