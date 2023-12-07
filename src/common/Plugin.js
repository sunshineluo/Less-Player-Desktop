export class Plugin {

    constructor({ id, name, version, about, about, repository, path, main, mainModule }) {
        this.id = id
        this.name = name || `Plugin-${Date.now()}`
        this.version = version || 'v1.0.0'
        this.about = about || ''
        this.repository = repository
        this.path = path
        this.main = main
        this.mainModule = mainModule
        this.type = 0   //0 => SF插件（single file）, 1 => Bundle插件
        this.state = 0
    }

}