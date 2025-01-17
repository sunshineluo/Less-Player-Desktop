import { defineStore } from 'pinia';
import { QQ } from '../../vendor/qq';
import { NetEase } from '../../vendor/netease';
import { KuWo } from '../../vendor/kuwo';
import { KuGou } from '../../vendor/kugou';
import { DouBan } from '../../vendor/douban';
import { RadioCN } from '../../vendor/radiocn';
import { Qingting } from '../../vendor/qingting';
import { LocalMusic } from '../../vendor/localmusic';
import { Ximalaya } from '../../vendor/ximalaya';
import { FreeFM } from '../../vendor/freefm';
import { useAppCommonStore } from './appCommonStore';
import { toLowerCaseTrimString } from '../../common/Utils';
import { useSettingStore } from './settingStore';



//weight权重，范围：1 - 10
const T_TYPES = [{
    code: 'songs',
    name: '歌曲',
    weight: 5
}, {
    code: 'playlists',
    name: '歌单',
    weight: 8,    //包括歌单电台
}, {
    code: 'albums',
    name: '专辑',
    weight: 3
}, {
    code: 'artists',
    name: '歌手',
    weight: 5
}, {
    code: 'fmRadios',
    name: '广播电台',
    weight: 3
}, {
    code: 'anchorRadios',
    name: '主播电台',
    weight: 3
}]

//音乐平台
const ALL_PLATFORMS = [
    {
        code: 'all',
        name: '全部平台',
        shortName: 'ALL',
        online: null,
        types: null
    },
    {
        code: QQ.CODE,
        name: 'QQ音乐',
        shortName: 'QQ',
        online: true,
        types: ['playlists', 'artists', 'albums'],
        weight: 8
    },
    {
        code: NetEase.CODE,
        name: '网易云音乐',
        shortName: 'WY',
        online: true,
        types: ['playlists', 'artists', 'albums', 'anchorRadios'],
        weight: 8
    },
    {
        code: KuWo.CODE,
        name: '酷我音乐',
        shortName: 'KW',
        online: true,
        types: ['playlists', 'artists', 'albums'],
        weight: 8
    },
    {
        code: KuGou.CODE,
        name: '酷狗音乐',
        shortName: 'KG',
        online: true,
        types: ['playlists', 'artists', 'albums'],
        weight: 8
    },
    {
        code: DouBan.CODE,
        name: '豆瓣FM',
        shortName: 'DB',
        online: true,
        types: ['playlists', 'artists', 'albums'],
        weight: 5
    },
    {
        code: LocalMusic.CODE,
        name: '本地歌曲',
        shortName: 'LO',
        online: false,
        types: null
    },
    {
        code: RadioCN.CODE,
        name: '央广云听',
        shortName: 'YT',
        online: true,
        //types: ['fmRadios', 'anchorRadios'],
        types: ['fmRadios'],
        weight: 5
    },
    {
        code: Qingting.CODE,
        name: '蜻蜓FM',
        shortName: 'QT',
        online: true,
        types: ['anchorRadios'],
        weight: 5
    },
    {
        code: Ximalaya.CODE,
        name: '喜马拉雅FM',
        shortName: 'XMLY',
        online: true,
        types: ['fmRadios'],
        weight: 5
    },
    {
        code: FreeFM.CODE,
        name: '自由FM',
        shortName: 'FREE',
        online: true,
        types: ['fmRadios'],
        weight: 5
    }
]

const scopePlatforms = {
    playlists: function () {
        return ALL_PLATFORMS.slice(1, 7)
    },
    artists: () => {
        return ALL_PLATFORMS.slice(1, 5)
    },
    radios: () => {
        const platforms = ALL_PLATFORMS.slice(7)
        platforms.splice(0, 0, ALL_PLATFORMS[2])
        return platforms
    },
    search: () => {
        const platforms = ALL_PLATFORMS.slice(1, 7)
        platforms.splice(4, 1)
        return platforms
    },
    random: () => {
        const platforms = ALL_PLATFORMS.slice(1, ALL_PLATFORMS.length - 1)
        platforms.splice(5, 1)
        return platforms
    },
    userhome: () => {
        const platforms = ALL_PLATFORMS.slice(0, ALL_PLATFORMS.length)
        platforms.splice(6, 1)
        return platforms
    }
}

const getScopePlatforms = (scope) => {
    const sPlatforms = scopePlatforms[toLowerCaseTrimString(scope)]
    return sPlatforms && sPlatforms()
}

//TODO
const vendors = {
    qq: QQ,
    netease: NetEase,
    kuwo: KuWo,
    kugou: KuGou,
    douban: DouBan,
    radiocn: RadioCN,
    qingting: Qingting,
    ximalaya: Ximalaya,
    local: LocalMusic,
    freefm: FreeFM,
}

//平台相关Store
export const usePlatformStore = defineStore('platforms', {
    //State
    state: () => ({
        currentPlatformIndex: 0,
        vendors,
    }),
    //Getters
    getters: {
        platforms() { //根据使用范围获取平台
            return (scope) => {
                const result = getScopePlatforms(scope)
                if (result) {
                    return result
                }

                //缺少范围或不匹配，按模式获取
                const { isArtistMode, isRadioMode, isUserHomeMode } = useAppCommonStore()
                if (isArtistMode) {
                    return getScopePlatforms('artists')
                } else if (isRadioMode) {
                    return getScopePlatforms('radios')
                } else if (isUserHomeMode) {
                    return getScopePlatforms('userhome')
                }
                return getScopePlatforms('playlists')
            }
        },
        activePlatforms() {
            return (scope) => {
                const { filterActiveModulesPlatforms } = useSettingStore()
                const { exploreModeCode } = useAppCommonStore()
                return filterActiveModulesPlatforms(this.platforms(scope), scope || exploreModeCode)
            }
        },
        currentPlatform() {
            return this.activePlatforms()[this.currentPlatformIndex]
        },
        currentPlatformCode() {
            return this.currentPlatform ? this.currentPlatform.code : ''
        },
        randomMusicTypes() {
            const types = T_TYPES.slice(1)
            types.splice(1, 2)
            return types
        },
    },
    //Actions
    actions: {
        updateCurrentPlatform(index) {
            this.currentPlatformIndex = index
        },
        updateCurrentPlatformByCode(code) {
            if (!code || code.trim().length < 1) {
                this.updateCurrentPlatform(-1)
                return
            }
            const platformArr = this.activePlatforms()
            for (var i = 0; i < platformArr.length; i++) {
                if (code === platformArr[i].code) {
                    this.updateCurrentPlatform(i)
                    return
                }
            }
            this.updateCurrentPlatform(-1)
        },
        getVendor(platform) {
            return this.vendors[toLowerCaseTrimString(platform)]
        },
        currentVender() {
            return this.getVendor(this.currentPlatformCode)
        },
        assertsPlatform(platform, code) {
            if (!this.isPlatformValid(platform)) return false
            return platform.trim() == code
        },
        isQQ(platform) {
            return this.assertsPlatform(platform, QQ.CODE)
        },
        isNetEase(platform) {
            return this.assertsPlatform(platform, NetEase.CODE)
        },
        isKuWo(platform) {
            return this.assertsPlatform(platform, KuWo.CODE)
        },
        isKuGou(platform) {
            return this.assertsPlatform(platform, KuGou.CODE)
        },
        isDouBan(platform) {
            return this.assertsPlatform(platform, DouBan.CODE)
        },
        isLocalMusic(platform) {
            return this.assertsPlatform(platform, LocalMusic.CODE)
        },
        isRadioCN(platform) {
            return this.assertsPlatform(platform, RadioCN.CODE)
        },
        isXimalaya(platform) {
            return this.assertsPlatform(platform, Ximalaya.CODE)
        },
        isFreeFM(platform) {
            return this.assertsPlatform(platform, FreeFM.CODE)
        },
        isFMRadioPlatform(platform) {
            return this.isRadioCN(platform)
                || this.isXimalaya(platform)
                || this.isFreeFM(platform)
        },
        isArtistDetailVisitable(platform) {
            return this.isPlatformValid(platform)
        },
        isAlbumDetailVisitable(platform) {
            if (this.isRadioCN(platform) || this.isXimalaya(platform)) return false
            return this.isPlatformValid(platform)
        },
        isPlatformValid(platform) {
            return platform && platform.trim().length > 0
        },
        isPlaylistType(type) {
            return type === 'playlists'
        },
        isAnchorRadioType(type) {
            return type === 'anchorRadios'
        },
        isFMRadioType(type) {
            return type === 'fmRadios'
        },
        getPlatformName(platform) {
            const result = ALL_PLATFORMS.filter(item => item.code == platform)
            return (!result || result.length != 1) ? null
                : result[0].name
        },
        getPlatformShortName(platform) {
            const result = ALL_PLATFORMS.filter(item => item.code == platform)
            return (!result || result.length != 1) ? null
                : result[0].shortName
        },
    }
})