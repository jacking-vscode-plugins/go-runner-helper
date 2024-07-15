# go-runner-helper README
> 自动扫描项目中的main包，并生成run配置文件，这样可以支持同一个项目中运行多个go程序。

## 使用步骤
> 1. 依赖于.vscode/launch.json，需要配置一个name为`RUN-GO`的配置，一个完整可用的launch.json如下(如果launch.json中有其他配置，可将`RUN-GO`部分复制到configurations中):
```json
{
    // 使用 IntelliSense 了解相关属性。 
    // 悬停以查看现有属性的描述。
    // 欲了解更多信息，请访问: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "RUN-GO",
            "type": "go",
            "request": "launch",
            "mode": "auto",
            "program": "${fileDirname}"
        }
    ]
}
```
> 2. 插件加载后，文本右上角有一个运行符号`▷`和刷新符号。
> 3. 点击刷新（load项目中的main package）
> 4. 点击运行`▷`（列出可以运行的main package）
> 5. 点击具体main package，即可开始执行
>
> 执行时重复4-5；新增main package时，重复一次3-5；

## Features
> 1. 自动扫描项目中的main包(main包中的文件至少1个<1M)
> 2. 支持列出扫出的main包，并选择其中之一执行。不必每次打开main包中的文件去执行main
> 3. 可运行main包列表按权重排序，权重点击一次+1，也可以配置(.vscode/run_go.json)
> 4. 如过不想列出某些main包，在.vscode/run_go.json中配置skipMatches
> 5. 自测linux下无问题，win osx暂未测试


## Requirements

None

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

### 0.0.4
> 1. 优化识别main包

### 0.0.5
> 1. 修复windows下运行错误

### 0.0.6
> 1. 完善文档

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
