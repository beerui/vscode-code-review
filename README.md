<template>
  <div @dblclick="toggleCamera">
    <video ref="preview" autoplay playsinline></video>
    <button @click="startRecording" :disabled="isRecording">Start Recording</button>
    <button @click="stopRecording" :disabled="!isRecording">Stop Recording</button>
    <button @click="saveVideo" :disabled="!recordedBlob">Save Video</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import RecordRTC from "recordrtc";
import { saveAs } from "file-saver";

export default {
  data() {
    return {
      mediaStream: null,        // 摄像头流
      recorder: null,           // RecordRTC 实例
      recordedBlob: null,       // 录制后的视频 Blob
      error: null,              // 错误信息
      currentFacingMode: "environment", // 当前摄像头模式（后置）
      isRecording: false,       // 是否正在录制
    };
  },
  methods: {
    // 初始化摄像头流
    async getMediaStream(facingMode = "environment") {
      try {
        if (this.mediaStream) {
          this.mediaStream.getTracks().forEach(track => track.stop()); // 停止当前流
        }
        this.mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode },
          audio: true,
        });
        this.$refs.preview.srcObject = this.mediaStream;
        this.currentFacingMode = facingMode;
        this.error = null;
      } catch (err) {
        this.error = `Failed to access camera: ${err.message}`;
        if (err.name === "OverconstrainedError") {
          this.error = "This camera mode is not supported on your device.";
        }
      }
    },
    // 切换摄像头
    toggleCamera() {
      const newFacingMode = this.currentFacingMode === "environment" ? "user" : "environment";
      this.getMediaStream(newFacingMode);
    },
    // 开始录制
    startRecording() {
      if (!this.mediaStream) {
        this.error = "Camera stream is not available.";
        return;
      }
      this.recorder = new RecordRTC(this.mediaStream, {
        type: "video",
      });
      this.recorder.startRecording();
      this.isRecording = true;
      this.recordedBlob = null; // 清除之前的录制内容
    },
    // 停止录制
    stopRecording() {
      if (this.recorder) {
        this.recorder.stopRecording(() => {
          this.recordedBlob = this.recorder.getBlob();
          this.isRecording = false;
        });
      } else {
        this.error = "Recorder is not active.";
      }
    },
    // 保存录制的视频
    saveVideo() {
      if (this.recordedBlob) {
        saveAs(this.recordedBlob, "video.webm");
      } else {
        this.error = "No recorded video available to save.";
      }
    },
  },
  mounted() {
    this.getMediaStream(); // 默认后置摄像头
  },
  beforeDestroy() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
    }
  },
};
</script>

<style scoped>
video {
  width: 100%;
  max-width: 600px;
  border: 1px solid #ccc;
  margin-bottom: 10px;
}
button {
  margin-right: 10px;
}
</style>