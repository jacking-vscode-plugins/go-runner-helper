# go-runner-helper README
> 自动扫描项目中的main包，并生成run配置文件，这样可以支持同一个项目中运行多个go程序。

## Features
> 1. 自动扫描项目中的main包(main包中的文件至少1个<1M，且文件须以package main开头)
> 2. 支持列出扫出的main包，并选择其中之一执行。不必每次打开main包中的文件去执行main
> 3. 可运行main包列表按权重排序，权重点击一次+1，也可以配置(.vscode/run_go.json)
> 4. 如过不想列出某些main包，在.vscode/run_go.json中配置skipMatches
> 5. 自测linux下无问题，win osx暂未测试


## Requirements

> 1. 依赖.vscode/launch.json中，需配置一个name为`RUN-GO`的配置，一个可用的模板如下：
```json
{
    "name": "RUN-GO",
    "type": "go",
    "request": "launch"
}
```
> 2. linux下测试通过，osx、win未测试 

## Extension Settings

None

## Known Issues

None

## Release Notes

### 0.0.1
> first init

### 0.0.2
> 1. create .vscode folder  if not exist
> 2. create file runner_go.json if not exist
> 3. fix: weight计数错误

---

## Following extension guidelines

Ensure that you've read through the extensions guidelines and follow the best practices for creating your extension.

* [Extension Guidelines](https://code.visualstudio.com/api/references/extension-guidelines)

## Working with Markdown

You can author your README using Visual Studio Code. Here are some useful editor keyboard shortcuts:

* Split the editor (`Cmd+\` on macOS or `Ctrl+\` on Windows and Linux).
* Toggle preview (`Shift+Cmd+V` on macOS or `Shift+Ctrl+V` on Windows and Linux).
* Press `Ctrl+Space` (Windows, Linux, macOS) to see a list of Markdown snippets.

## For more information

* [Visual Studio Code's Markdown Support](http://code.visualstudio.com/docs/languages/markdown)
* [Markdown Syntax Reference](https://help.github.com/articles/markdown-basics/)

**Enjoy!**
