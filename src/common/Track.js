import { Lyric } from './Lyric';
import { toTrimString } from './Utils';
import { toMmss } from './Times';
import { DEFAULT_COVER_BASE64 } from './Constants';



export class Track {
    constructor(id, platform, title, artist, album,
        duration, cover, url, type,
        pid, mv, payPlay, payDownload) {
        this.id = toTrimString(id)
        this.platform = platform
        this.title = toTrimString(title)
        //[ {id, name} ]
        this.artist = artist ? artist : []
        //数据不完整
        this.artistNotCompleted = false
        //{id, name}
        this.album = album ? album : ({ id: '', name: '' })
        //Millis
        this.duration = duration ? duration : 0
        this.cover = cover
        this.url = toTrimString(url)
        this.lyric = new Lyric()
        this.lyricTrans = null
        this.lyricRoma = null
        this.type = type || 0 //与 Playlist中的type一致
        this.pid = toTrimString(pid) //playlistId
        //额外信息，当内容存在时显示，同时分别隐藏 artist、album
        this.extra1 = null
        this.extra2 = null
        //MV id
        this.mv = mv
        //VIP付费信息
        this.payPlay = payPlay
        this.payDownload = payDownload
        //是否为替换版本
        this.isCandidate = false

        //本地歌曲属性
        this.publishTime = null
    }

    mmssDuration() {
        return Track.mmssDuration(this)
    }

    //所有歌手名字
    artistName() {
        return Track.artistName(this)
    }

    firstArtistName() {
        return Track.firstArtistName(this)
    }

    hasId() {
        return Track.hasId(this)
    }

    hasUrl() {
        return Track.hasUrl(this)
    }

    hasCover() {
        return Track.hasCover(this)
    }

    hasLyric() {
        return Track.hasLyric(this)
    }

    lyricData() {
        return Track.lyricData(this)
    }

    static mmssDuration(track) {
        return toMmss(track.duration || 0)
    }

    hasPid() {
        return Track.hasPid(this)
    }

    static isVip(track) {
        return track && track.payPlay
    }

    static title(track) {
        return track ? track.title : ''
    }

    static artistName(track) {
        let artistName = ''
        if (track && track.artist) {
            const names = []
            track.artist.forEach(e => names.push(e.name));
            artistName = names.join('、')
            artistName = artistName.slice(0, artistName.length)
        }
        return artistName
    }

    static albumName(track) {
        return track && track.album ? toTrimString(track.album.name) : null
    }

    static hasLyric(track) {
        return track && track.lyric && Lyric.hasData(track.lyric)
    }

    static hasUrl(track) {
        return track && track.url && toTrimString(track.url).length > 0
    }

    static hasCover(track) {
        if (!track || !track.cover) return false
        track.cover = toTrimString(track.cover)
        if (track.cover.length < 1) return false
        if (track.cover == 'default_cover.png') return false
        return true
    }

    static hasId(track) {
        if (!track || !track.id) return false
        const id = track.id
        if (typeof (id) == 'number') return id > 0
        if (typeof (id) == 'string') return toTrimString(id).length > 0
    }

    static firstArtistName(track) {
        return track ? Track.artistName(track).split('、')[0].split('&')[0] : ''
    }

    static lyricData(track) {
        return track && track.lyric ? track.lyric.data : new Map()
    }

    static lyricOffset(track) {
        return track && track.lyric ? (track.lyric.offset || 0) : 0
    }

    static hasLyricTrans(track) {
        return track && track.lyricTrans && Lyric.hasData(track.lyricTrans)
    }

    static lyricTransData(track) {
        return track && track.lyricTrans ? track.lyricTrans.data : null
    }

    static hasLyricRoma(track) {
        return track && track.lyricRoma && Lyric.hasData(track.lyricRoma)
    }

    static lyricRomaData(track) {
        return track && track.lyricRoma ? track.lyricRoma.data : null
    }

    static isEquals(t1, t2) {
        if (!t1 || !t2) return false
        return t1.id == t2.id && t1.platform == t2.platform
    }

    static hasMv(track) {
        if (!track || !track.mv) return false
        const mv = track.mv.toString()
        if (typeof (mv) == 'number') return mv > 0
        if (typeof (mv) == 'string') return toTrimString(mv).length > 0
    }

    static hasPid(track) {
        if (!track || !track.pid) return false
        const pid = track.pid
        if (typeof (pid) == 'number') return pid > 0
        if (typeof (pid) == 'string') return toTrimString(pid).length > 0
    }

    static isVip(track) {
        if (!track) return false
        return track.payPlay
    }

    static hasArtist(track) {
        return track && track.artist
            && track.artist.length > 0
    }

    static isCandidate(track) {
        return track && track.isCandidate
    }

    static cover(track) {
        return Track.hasCover(track) ? track.cover : null
    }

    static coverDefault(track) {
        return Track.hasCover(track) ? track.cover : DEFAULT_COVER_BASE64
    }

}