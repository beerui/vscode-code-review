<template>
  <div>
    <!-- 隐藏 vue-audio-recorder 的默认 UI -->
    <vue-audio-recorder
      ref="audioRecorder"
      v-model="audioBlob"
      :is-recording="isRecording"
      :auto-play="false"
      :audio-format="'audio/wav'"
      style="display: none;"
      @on-stop="handleStop"
    />

    <!-- 自定义按钮 -->
    <button @click="toggleRecording">
      {{ isRecording ? "停止录音" : "开始录音" }}
    </button>

    <!-- 播放录音 -->
    <div v-if="audioBlob">
      <audio :src="audioUrl" controls></audio>
      <p>录音文件已生成，可以播放</p>
    </div>
  </div>
</template>

<script>
import { VueAudioRecorder } from "vue-audio-recorder";

export default {
  components: {
    VueAudioRecorder,
  },
  data() {
    return {
      audioBlob: null, // 存储录音的 Blob 数据
      audioUrl: null, // 录音文件的 URL
      isRecording: false, // 录音状态
    };
  },
  methods: {
    toggleRecording() {
      if (this.isRecording) {
        // 调用组件方法停止录音
        this.$refs.audioRecorder.stop();
      } else {
        // 调用组件方法开始录音
        this.$refs.audioRecorder.start();
      }
      this.isRecording = !this.isRecording;
    },
    handleStop(blob) {
      // 录音停止后的回调
      this.audioBlob = blob;
      this.audioUrl = URL.createObjectURL(blob); // 生成可播放的音频 URL
    },
  },
};
</script>

<style scoped>
button {
  margin: 10px;
  padding: 10px 20px;
  font-size: 16px;
  cursor: pointer;
}
audio {
  display: block;
  margin-top: 10px;
}
</style>