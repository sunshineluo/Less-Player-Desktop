import EventBus from '../common/EventBus';
import Hls from 'hls.js';
import { WebAudioApi } from './WebAudioApi';
import { toTrimString } from './Utils';



let audioNode = null, lastPlayTime = null, singleton = null

export class RadioPlayer {
    constructor(channel) {
        this.channel = channel
        this.hls = new Hls()
        this.playing = false
        this.channelChanged = false
        this.retry = 0
        this.isBindHlsEvent = false
        this.webAudioApi = null
        this.pendingSoundEffectType = 0 // 0 =>均衡器， 1 => 混响
        this.pendingSoundEffect = null
        this.animationFrameCnt = 0 //动画帧数计数器，控制事件触发频率，降低CPU占用
        this.stateRefreshFrequency = 60 //歌曲进度更新频度
        this.spectrumRefreshFrequency = 3 //歌曲频谱更新频度
    }

    static get() {
        if (!singleton) singleton = new RadioPlayer()
        return singleton
    }

    /* 初始化并配置播放器 */
    static initAndSetup() {
        const player = RadioPlayer.get()
        return player.on('radio-init', node => player._createWebAudioApi(node))
            .on('radio-channelChange', channel => player.setChannel(channel))
            .on('radio-play', channel => player.playChannel(channel))
            .on('radio-togglePlay', () => player.togglePlay())
            .on('volume-set', volume => player.volume(volume))
            .on('radio-stop', () => player.setChannel(null))
            .on('playbackQueue-empty', () => player.setChannel(null))
            .on('track-play', () => player.setChannel(null))
            .on('track-restore', channel => player.setChannel(channel))
            .on('track-updateEQ', values => player.updateEQ(values))
            .on('track-updateIR', source => player.updateIR(source))
            .on('track-stateRefreshFrequency', value => player.stateRefreshFrequency = value)
            .on('track-spectrumRefreshFrequency', value => player.spectrumRefreshFrequency = value)
    }

    //播放
    play() {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        if (!this.channel) return
        if (toTrimString(this.channel.url).length < 1) {
            //this._retryPlay(1)
            return
        }

        //this.hls.loadSource('http://ngcdn001.cnr.cn/live/zgzs/index.m3u8')
        //this.channel.url = "https://npr-ice.streamguys1.com/live.mp3"
        this.hls.loadSource(this.channel.url)
        this.hls.attachMedia(audioNode)

        //Hls事件绑定
        if (!this.isBindHlsEvent) {
            const self = this
            this.hls.on(Hls.Events.MANIFEST_PARSED, function () {
                audioNode.play()
                self.setState(true)
                self.channelChanged = false
                self.retry = 0
                lastPlayTime = Date.now()
                this.animationFrameCnt = 0
                requestAnimationFrame(self._step.bind(self))
            })
            this.hls.on(Hls.Events.ERROR, function () {
                self._retryPlay(1)
            })
            this.isBindHlsEvent = true
        }
    }

    //暂停
    pause() {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        if (!this.playing) return
        this.hls.detachMedia()
        this.setState(false)
    }

    togglePlay() {
        if (this.playing) {
            this.pause()
        } else {
            this.play()
        }
    }

    setState(state) {
        this.playing = state
        this.notify('radio-state', state)
    }

    setChannel(channel) {
        this.pause()
        this.hls.stopLoad()
        this.channel = channel
        this.channelChanged = true
    }

    playChannel(channel) {
        this.setChannel(channel)
        this.play()
    }

    volume(value) {
        if (!Hls.isSupported()) return
        if (!audioNode) return
        audioNode.volume = value
    }

    _step() {
        if (!this.channel) return
        if (!this.playing) return
        const nowTime = Date.now()
        const currentTime = (nowTime - lastPlayTime) || 0
        const currentSecs = currentTime / 1000
        if (this.isStateRefreshEnabled()) this.notify('track-pos', currentSecs)
        this._resolveSound()
        this._countAnimationFrame()
        requestAnimationFrame(this._step.bind(this))
    }

    on(event, handler) {
        EventBus.on(event, handler)
        return this
    }

    notify(event, args) {
        EventBus.emit(event, args)
        return this
    }

    _createWebAudioApi(node) {
        if (!node) return
        audioNode = node
        if (this.webAudioApi) return
        this.webAudioApi = WebAudioApi.create(new AudioContext(), audioNode)
    }

    _resolveSound() {
        if (!this.webAudioApi) return
        this._resolvePendingSoundEffect()
        if (!this.isSpectrumRefreshEnabled()) return
        const { analyser } = this.webAudioApi
        if (!analyser) return
        const freqData = new Uint8Array(analyser.frequencyBinCount)
        analyser.getByteFrequencyData(freqData)
        this.notify('track-spectrumData', freqData)
    }

    updateEQ(values) {
        if (this.webAudioApi) {
            this.webAudioApi.updateEQ(values)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffectType = 0
            this.pendingSoundEffect = values
        }
    }

    updateIR(source) {
        if (this.webAudioApi) {
            this.webAudioApi.updateIR(source)
            this.pendingSoundEffect = null
        } else {
            this.pendingSoundEffectType = 1
            this.pendingSoundEffect = source
        }
    }

    _resolvePendingSoundEffect() {
        if (!this.pendingSoundEffect) return
        if (this.pendingSoundEffectType === 1) {
            this.updateIR(this.pendingSoundEffect)
        } else {
            this.updateEQ(this.pendingSoundEffect)
        }
    }

    _countAnimationFrame() {
        const max = this.stateRefreshFrequency || 1024
        this.animationFrameCnt = (this.animationFrameCnt + 1) % max
    }

    isStateRefreshEnabled() {
        return this.animationFrameCnt % this.stateRefreshFrequency == 0
    }

    isSpectrumRefreshEnabled() {
        return this.animationFrameCnt % this.spectrumRefreshFrequency == 0
    }

    _notifyError(isRetry) {
        const { channel: track } = this
        this.notify('track-error', { isRetry, track, currentTime: 0, radio: true })
    }

    _retryPlay(maxRetry) {
        const isRetry = this.retry < maxRetry
        this._notifyError(isRetry)
        if (isRetry) {
            ++this.retry
        } else {
            this.retry = 0
        }
    }
}
