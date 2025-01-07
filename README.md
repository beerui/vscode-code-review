<template>
  <div>
    <video ref="preview" autoplay playsinline></video>
    <button @click="startRecording">Start Recording</button>
    <button @click="stopRecording">Stop Recording</button>
    <button @click="saveVideo">Save Video</button>
    <p v-if="error">{{ error }}</p>
  </div>
</template>

<script>
import RecordRTC from "recordrtc";
import { saveAs } from "file-saver";

export default {
  data() {
    return {
      mediaStream: null, // 摄像头流
      recorder: null,    // RecordRTC 对象
      error: null,       // 错误信息
    };
  },
  methods: {
    async getMediaStream() {
      try {
        this.mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        this.$refs.preview.srcObject = this.mediaStream;
      } catch (err) {
        this.error = "Failed to access camera: " + err.message;
      }
    },
    startRecording() {
      if (!this.mediaStream) {
        this.error = "Media stream not available. Please enable camera.";
        return;
      }
      this.recorder = new RecordRTC(this.mediaStream, { type: "video" });
      this.recorder.startRecording();
    },
    stopRecording() {
      if (this.recorder) {
        this.recorder.stopRecording(() => {
          this.error = null;
        });
      } else {
        this.error = "Recorder is not active.";
      }
    },
    saveVideo() {
      if (this.recorder) {
        const blob = this.recorder.getBlob();
        saveAs(blob, "video.webm");
      } else {
        this.error = "No recorded video available to save.";
      }
    },
  },
  mounted() {
    this.getMediaStream();
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