// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { GoProgram, GoManager } from './GoManager';
import * as rs from './RunnerScanner'
import * as tps from './types'
import * as path from 'path'

const runnerListCmd = "code-runner.runner-list"
const refreshRunnerListCmd = "code-runner.scan-runner"

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const runnerList = vscode.commands.registerCommand(runnerListCmd, (fileUri: vscode.Uri) => {
		showGoProgramListQuickPick(context)
	});
	const refreshRunnerList = vscode.commands.registerCommand(refreshRunnerListCmd, (gp: GoProgram) => {
		const rootWorkspaceFolder = getRootWorkspaceFolder()
		if (rootWorkspaceFolder == null) {
			return
		}
		rs.checkRunnerFile(path.join(rootWorkspaceFolder.uri.fsPath, tps.goRunnerFile))
		rs.showTypeListQuickPick(context, rootWorkspaceFolder.uri.fsPath)
	})

	context.subscriptions.push(runnerList)
	context.subscriptions.push(refreshRunnerList)

	return
}

function getRootWorkspaceFolder(): vscode.WorkspaceFolder | null {
	const rootFolders = vscode.workspace.workspaceFolders
	if (rootFolders) {
	} else {
		vscode.window.showInformationMessage('No workspace opened.');
		return null
	}
	return rootFolders[0]
}

function showGoProgramListQuickPick(context: vscode.ExtensionContext) {

	const rootWorkspaceFolder = getRootWorkspaceFolder()
	if (rootWorkspaceFolder == null) { return }

	const rootFolder = rootWorkspaceFolder.uri.fsPath
	const runnerFileFullPath = path.join(rootFolder, tps.goRunnerFile)
	const gm = new GoManager(runnerFileFullPath)
	// 展示文件列表
	vscode.window.showQuickPick(gm.getAllGpsPkgPath(), { placeHolder: "GoProgram select to run" }).
		then((selectedItem) => {
			if (selectedItem) {
				let gp: GoProgram = gm.getGpDetailByPkgPath(selectedItem)
				// vscode.window.showInformationMessage("" + (gp instanceof GoProgram))
				if (gp == null) {
					vscode.window.showErrorMessage(`goProgram not defined:${selectedItem}`)
					return
				}
				// 
				if (gp.args == null) {
					gp.args = gm.getGoProgramInfos().defaultArgs
				}
				gp.buildAndRunGo(rootWorkspaceFolder, gm.getGoProgramInfos().buildArgs)

				// weight+1
				gm.updateRunnerWeight(selectedItem)
				rs.refreshFile(runnerFileFullPath, JSON.stringify(gm.getGoProgramInfos(), null, 2))
				return
			}
		});
}


// This method is called when your extension is deactivated
export function deactivate() { }
