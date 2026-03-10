/**
 * AudioWorklet 处理器：将麦克风 float32 数据转发到主线程（替代已弃用的 ScriptProcessorNode）
 */
class DictationProcessor extends AudioWorkletProcessor {
  process(inputs, outputs) {
    const input = inputs[0]
    if (!input || input.length === 0) return true
    const channel = input[0]
    if (!channel || channel.length === 0) return true
    const copy = new Float32Array(channel.length)
    copy.set(channel)
    this.port.postMessage(copy, [copy.buffer])
    return true
  }
}

registerProcessor('dictation-processor', DictationProcessor)
