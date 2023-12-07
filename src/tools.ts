
import * as fs from "fs"
import * as vscode from "vscode"

export function readFileSync(fp: string): string | Error {
    try {
        const data: Buffer = fs.readFileSync(fp)
        const content: string = data.toString()
        return content
    } catch (error) {
        return Error("读取文件(" + fp + ")失败:" + error)
    }
}
export function writeFileSync(fp: string, data: string): void {
    fs.writeFileSync(fp, data)
}

export function appendWriteSync(fp: string, data: string): void {
    fs.appendFileSync(fp, data)
}

export function isError(e: any): boolean {
    return e instanceof Error ? true : false
}
export function vscodeShowInfoMsg<T extends string>(message: string, ...items: T[]) {
    vscode.window.showInformationMessage(message, ...items)
}
export function vscodeShowErrorMsg<T extends string>(message: string, ...items: T[]) {
    vscode.window.showErrorMessage(message, ...items)
}