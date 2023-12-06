import * as vscode from "vscode"
import * as tools from "./tools"
import * as fs from "fs"
import * as path from "path"
import *as tps from "./types"
import { GoManager, GoProgram, } from "./GoManager"


const lang = require("./types").Language


interface LangExecMap {
    [key: string]: Function
}
const execMap: LangExecMap = {
    [lang.Go]: scanGo,
}

export function showTypeListQuickPick(context: vscode.ExtensionContext, rootPath: string) {

    vscode.window.showQuickPick(Object.keys(execMap), { placeHolder: "scan language" }).
        then((selectedItem) => {
            if (selectedItem == undefined) {
                tools.vscodeShowErrorMsg("未选择扫描语言")
                return
            }
            const scanFunc = execMap[selectedItem]
            const mainlist: string[] = scanFunc(rootPath)
            // 替换
            const goRunnerFileFullPath = path.join(rootPath, tps.goRunnerFile)
            const gm = new GoManager(goRunnerFileFullPath)
            const gps = gm.getGoProgramInfos()

            const newMain: string[] = []
            mainlist.forEach(val => {
                if (gps.existRunnerByFilePath(val) || gps.existSkipByFilePath(val)) {
                    return
                }
                newMain.push(val)
            });
            newMain.forEach(val => {
                gps.addGoProgram(new GoProgram(val))
            })
            refreshFile(goRunnerFileFullPath, JSON.stringify(gps, null, 2))
        });
}

export function refreshFile(filepath: string, body: string) {
    if (filepath == "" || filepath == null || filepath == undefined) {
        tools.vscodeShowErrorMsg("刷新配置时，目标文件不能为空")
        return
    }
    const stats = fs.statSync(filepath)
    if (stats.isDirectory()) {
        tools.vscodeShowErrorMsg("刷新配置时，目标不能为目录")
        return
    }
    tools.writeFileSync(filepath, body)
}


function scanGo(rootPath: string): string[] {
    if (rootPath == "" || rootPath == "/" || rootPath == undefined) {
        tools.vscodeShowErrorMsg("待扫描的文件夹路径不能为空或根目录(" + rootPath + ")")
        return []
    }
    const mainList = workDir(rootPath, rootPath, 0, function (file: string): boolean {
        if (!file.endsWith(".go")) {
            return false
        }
        const fileBody = tools.readFileSync(file)
        if (fileBody instanceof Error) {
            return false
        }
        return fileBody.startsWith("package main")
    })
    return mainList
}



function workDir(workRootPath: string, directoryPath: string, deep: number, checkMain: Function): string[] {
    if (deep > 10) {
        return []
    }
    let mainsList: string[] = []
    const items = fs.readdirSync(directoryPath)
    let nowMain = false
    items.forEach((item) => {
        const fullPath = path.join(directoryPath, item);
        const stats = fs.statSync(fullPath);
        // 判断是否为目录
        if (stats.isDirectory()) {
            // 递归遍历子目录
            const subDirMains = workDir(workRootPath, fullPath, deep + 1, checkMain);
            subDirMains.forEach((v) => { mainsList.push(v) })
        } else {
            // byte=1 kb=1024 mb=1024*1024 // 大于1M忽略 // 1M源码几万行了，实际一般不会超过这么多代码
            if (nowMain || stats.size > 1024 * 1024) {
                return
            }
            const isMain: boolean = checkMain(fullPath)
            if (!isMain) {
                return
            }
            nowMain = true
            mainsList.push(path.relative(workRootPath, path.dirname(fullPath)))
        }
    })
    return mainsList
}


export function checkRunnerFile(fileFullPath: string) {
    if (fileFullPath == "") {
        return
    }
    const dirName = path.dirname(fileFullPath)
    if (!fs.existsSync(dirName)) {
        const suc = fs.mkdirSync(dirName, { recursive: true })
        if (suc == undefined) {
            tools.vscodeShowErrorMsg("创建目录失败:" + dirName)
            return
        }
    }
    if (!fs.existsSync(fileFullPath)) {
        tools.writeFileSync(fileFullPath, "{}")
    }
}