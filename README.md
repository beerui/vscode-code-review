实现录音和播放分别在两个独立组件中，可以通过父组件管理录音的结果并传递给播放列表组件。以下是完整的实现方案：


---

1. 录音组件：AudioRecorder.vue

这个组件负责录制音频，并将录音结果传递到父组件。

<template>
  <div>
    <vue-audio-recorder
      v-model="audioBlob"
      :is-recording="isRecording"
      :max-duration="300"
      @on-stop="handleStop"
    >
    </vue-audio-recorder>
    <button @click="toggleRecording">
      {{ isRecording ? '停止录音' : '开始录音' }}
    </button>
  </div>
</template>

<script>
import { VueAudioRecorder } from 'vue-audio-recorder';

export default {
  name: "AudioRecorder",
  components: {
    VueAudioRecorder,
  },
  data() {
    return {
      audioBlob: null,
      isRecording: false,
    };
  },
  methods: {
    toggleRecording() {
      this.isRecording = !this.isRecording;
    },
    handleStop(blob) {
      // 将录音结果传递给父组件
      this.$emit("on-recorded", blob);
      this.isRecording = false;
    },
  },
};
</script>

<style scoped>
button {
  margin: 10px;
}
</style>


---

2. 播放列表组件：AudioPlayerList.vue

这个组件负责接收录音文件并实现播放功能。

<template>
  <div>
    <div v-if="audioList.length === 0">暂无录音</div>
    <ul>
      <li v-for="(audio, index) in audioList" :key="index">
        <span>{{ audio.name }}</span>
        <audio :src="audio.url" controls></audio>
        <button @click="deleteAudio(index)">删除</button>
      </li>
    </ul>
  </div>
</template>

<script>
export default {
  name: "AudioPlayerList",
  props: {
    audioList: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    deleteAudio(index) {
      // 删除音频
      this.$emit("on-delete", index);
    },
  },
};
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
}
li {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
li span {
  margin-right: 10px;
}
li audio {
  margin-right: 10px;
}
</style>


---

3. 父组件：AudioManager.vue

父组件负责管理录音文件列表，并将录音结果传递给播放列表组件。

<template>
  <div>
    <h3>录音功能</h3>
    <AudioRecorder @on-recorded="addAudio" />

    <h3>录音列表</h3>
    <AudioPlayerList
      :audioList="audioList"
      @on-delete="deleteAudio"
    />
  </div>
</template>

<script>
import AudioRecorder from "./AudioRecorder.vue";
import AudioPlayerList from "./AudioPlayerList.vue";

export default {
  name: "AudioManager",
  components: {
    AudioRecorder,
    AudioPlayerList,
  },
  data() {
    return {
      audioList: [], // 存储录音文件
    };
  },
  methods: {
    addAudio(blob) {
      // 添加新录音到列表
      const url = URL.createObjectURL(blob);
      const name = `录音 ${new Date().toLocaleTimeString()}`;
      this.audioList.push({ name, url, blob });
    },
    deleteAudio(index) {
      // 删除录音
      this.audioList.splice(index, 1);
    },
  },
};
</script>


---

4. 功能说明

录音组件 (AudioRecorder.vue)

使用 vue-audio-recorder 实现录音功能。

录音结束后通过 @on-recorded 事件将录音数据（Blob）发送给父组件。


播放列表组件 (AudioPlayerList.vue)

接收父组件传递的 audioList，展示录音文件。

每个录音文件可以播放或删除。

删除时通过 @on-delete 通知父组件。


父组件 (AudioManager.vue)

管理录音文件列表。

将录音数据传递给播放列表组件。

提供删除功能，修改录音列表。



---

5. 优化与扩展

录音文件重命名：允许用户重命名录音文件。

录音文件下载：在播放列表中添加下载按钮，将录音保存到本地。

存储管理：使用 LocalStorage 或后端接口存储录音文件，便于持久化。


通过以上结构，录音和播放功能模块化分离，便于维护和扩展，同时可以在移动端流畅使用。

