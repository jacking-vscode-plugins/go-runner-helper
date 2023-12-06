import * as tools from "./tools"
import * as vscode from "vscode"
import *as tps from "./types"
const fs = require('fs').Promise

export class GoManager {
    public runnerpath: string;
    private gps: GoProgramInfos = new GoProgramInfos([], []);
    private inited: boolean = false;
    private initErr: Error | null = null;
    constructor(runnerpath: string) {
        this.runnerpath = runnerpath
    }

    public updateRunnerWeight(fp: string) {
        for (let index = 0; index < this.gps.runners.length; index++) {
            const element = this.gps.runners[index];
            if (element.filepath == fp) {
                this.gps.runners[index].weight++
                break
            }
        }
        this.gps.sortRunners()
    }

    private checkInitAndDo() {
        if (this.initErr != null) {
            vscode.window.showErrorMessage("初始化goProgramInofs失败:" + this.initErr.message)
            return
        }
        if (this.inited) {
            return
        }
        const initErr = this.init()
        if (initErr instanceof Error) {
            this.initErr = initErr
            vscode.window.showErrorMessage("初始化goProgramInofs失败:" + initErr.message)
        }
        this.inited = true
    }
    public init(): Error | null {
        const gps = this.readFileAndParseGoPros()
        if (gps instanceof Error) {
            return gps
        }
        //
        let newGps = new GoProgramInfos()
        newGps.init(gps)
        this.gps = newGps
        return null
    }
    public getGoProgramInfos(): GoProgramInfos {
        this.checkInitAndDo()
        return this.gps
    }
    public getAllGpsPkgPath(): string[] {
        this.checkInitAndDo()
        const result = this.gps.runners.map(v => v.filepath)
        return result
    }
    public getGpDetailByPkgPath(pkgPath: string): GoProgram {
        this.checkInitAndDo()

        for (let index = 0; index < this.gps.runners.length; index++) {
            const element: GoProgram = this.gps.runners[index];
            if (element.filepath == pkgPath) {
                return element
            }
        }
        return new GoProgram("", [])
    }

    private readFileAndParseGoPros(): GoProgramInfos | Error {
        const content = tools.readFileSync(this.runnerpath)
        // error
        if (content instanceof Error) {
            return content
        }
        // string
        return unMarshalGoProgramInfos(content)
    }
}

function unMarshalGoProgramInfos(content: string): GoProgramInfos | Error {
    let gps: GoProgramInfos
    try {
        gps = JSON.parse(content)
        return gps
    } catch (error) {
        return Error("解析GoPragramInfos失败:" + error)
    }
}

export class GoProgram {

    public filepath: string = "";
    public weight: number = 0;
    public args: string[] | undefined = undefined;

    constructor(filepath?: string, args?: string[], gpis?: GoProgramInfos) {
        if (filepath != null) {
            this.filepath = filepath

        }
        if (args != null) {
            this.args = args
        }
    }
    public async buildAndRunGo(rootFolder: vscode.WorkspaceFolder, buildArgs: string[] | undefined) {
        this.buildGo(rootFolder, buildArgs, (event: vscode.TaskProcessEndEvent) => {
            this.runGo(rootFolder)
        })
    }

    public async runGo(workspaceRoot: vscode.WorkspaceFolder) {

        try {
            const rootPath = this.getRootPathByWorkspaceRoot(workspaceRoot)
            // 读取用户定义的配置
            const launchConfig = vscode.workspace.getConfiguration('launch');
            if (!launchConfig) {
                vscode.window.showWarningMessage('No launch configuration defined by the user.');
                return;
            }
            let launchRunGo: vscode.DebugConfiguration | null = null;
            for (let index = 0; index < launchConfig.configurations.length; index++) {
                const element = launchConfig.configurations[index];
                if (element.name == "RUN-GO") {
                    launchRunGo = element
                }
            }
            if (launchRunGo == null) {
                vscode.window.showErrorMessage("launch.json 未定义RUN-GO")
                return
            }

            // 创建调试配置对象
            const debugConfig: vscode.DebugConfiguration = {
                name: 'RUN-GO',
                type: 'go',
                request: 'launch',
                // ...launchConfig, // 将用户定义的配置合并到调试配置中
                // 指定 workspaceFolder
                file: '${workspaceFolder}/' + this.filepath + "/main.go",
                // program: '${workspaceRoot}/.build/${fileDirnameBasename}/${fileDirnameBasename}',
                program: this.getBuildOutBinFileAbs(rootPath),
                args: this.args,
                cwd: "${workspaceRoot}",
                mode: "exec",
                depends: []
            };
            vscode.debug.startDebugging(workspaceRoot, debugConfig);
        } catch (error) {
            vscode.window.showErrorMessage(JSON.stringify(error))
        }
    }

    private async buildGo(workspaceRoot: vscode.WorkspaceFolder, defaultBuildArgs: string[] | undefined, callback: Function) {

        const buildArgs: string[] = []
        if (defaultBuildArgs != undefined) {
            buildArgs.push(...defaultBuildArgs)
        }
        const rootPath = workspaceRoot.uri.fsPath

        buildArgs.push("-o", this.getBuildOutBinFileAbs(rootPath), this.getBuildSrcPathAbs(rootPath))

        // 获取任务执行器
        const buildTask = new vscode.Task(
            { type: 'shell', label: 'build_go' },
            workspaceRoot, // 指定工作区
            'build_go', // 任务名称
            'shell',        // 任务类型
            new vscode.ShellExecution('go', buildArgs),// 任务执行
        )

        const taskExecution: vscode.TaskExecution = await vscode.tasks.executeTask(buildTask);
        vscode.tasks.onDidEndTaskProcess((event) => {
            if (event.execution == taskExecution) {
                callback(event)
            }
        })
    }

    private getRootPathByWorkspaceRoot(workspaceRoot: vscode.WorkspaceFolder): string {
        return workspaceRoot.uri.fsPath
    }

    private async clearBeforeBuild(workspaceRoot: vscode.WorkspaceFolder) {

        const rootPath = this.getRootPathByWorkspaceRoot(workspaceRoot)

        const rmFile = this.getBuildOutBinFileAbs(rootPath)
        fs.access(rmFile, fs.constants.F_OK)
            .then(async () => {
                try {
                    // 获取任务执行器
                    const buildTask = new vscode.Task(
                        { type: 'shell', label: 'clear_go_bin' },
                        workspaceRoot, // 指定工作区
                        'clear_go_bin', // 任务名称
                        'shell',        // 任务类型
                        new vscode.ShellExecution('rm', ["-rf", rmFile]) // 任务执行
                    )
                    const taskExecution = await vscode.tasks.executeTask(buildTask);
                    if (taskExecution) {
                        vscode.window.showInformationMessage(JSON.stringify(taskExecution))
                    } else {
                        console.error('Failed to execute task.');
                    }
                } catch (error) {
                    console.error(error);
                }
            })
            .catch((err: any) => {
                vscode.window.showErrorMessage(`删除二进制文件失败:` + JSON.stringify(err))
            });
    }
    private getBuildSrcPathAbs(root: string) {
        return root + "/" + this.filepath
    }
    private getBuildOutBinFileAbs(root: string) {
        return this.getBuildOutPathAbs(root) + "/" + this.getBuildPathPkgName() + ".bin"
    }
    private getBuildOutPathAbs(root: string) {
        return root + "/" + tps.buildOutBasePath + "/" + this.filepath
    }
    private getBuildPathPkgName(): string {
        const parts = this.filepath.split('/');
        return parts[parts.length - 1];
    }

    public init(gp: GoProgram) {
        this.args = gp.args
        this.filepath = gp.filepath
    }
}

export class GoProgramInfos {

    public skipMatches: string[] = []
    public buildArgs: string[] | undefined = undefined;
    public defaultArgs: string[] | undefined = undefined;
    public runners: GoProgram[] = [];

    constructor(runners?: GoProgram[], defaultArgs?: string[]) {
        if (runners != null) {
            this.runners = runners
        }
        if (defaultArgs != null) {
            this.defaultArgs = defaultArgs
        }
    }

    public sortRunners() {
        this.runners = this.runners.sort((a, b) => { return b.weight - a.weight })
    }

    public existSkipByFilePath(fp: string): boolean {
        for (let index = 0; index < this.skipMatches.length; index++) {
            const reg = new RegExp(this.skipMatches[index]);
            if (reg.test(fp)) {
                return true
            }
        }
        return false
    }

    public existRunnerByFilePath(fp: string): boolean {
        return this.runners.filter(gp => {
            return gp.filepath == fp
        }).length > 0
    }

    public addGoProgram(gp: GoProgram) {
        this.runners.push(gp)
    }

    public init(gpis: GoProgramInfos) {
        let runners: GoProgram[] = []
        for (let index = 0; index < gpis.runners.length; index++) {
            let gp = new GoProgram()
            gp.init(gpis.runners[index])
            runners.push(gp)
        }
        //
        this.runners = runners
        this.defaultArgs = gpis.defaultArgs
        this.buildArgs = gpis.buildArgs
        this.skipMatches = gpis.skipMatches

        this.sortRunners()
    }
}