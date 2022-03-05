# Changelog

## Release

**INFO:** This workflow contains Node.js scripts. 
If you have not installed Node.js runtime, you should download the workflow file that contains Node.js binary file. 
Or you can download and install [Node.js](https://nodejs.org/en/download/) before using this workflow.

| The condition                                    | What should you download           | Comment  |
|--------------------------------------------------|------------------------------------|----------|
| **Already installed Node.js** (Node.js 10 or later)  | **OpenInVSCode.alfredworkflow**        |          |
| Mac with **Intel chip**                              | **OpenInVSCode.amd64.alfredworkflow**  | This workflow ships Node.js v16.14.0 binary file for x64   |
| Mac with **Apple chip** (M1)                         | **OpenInVSCode.arm64.alfredworkflow**  | This workflow ships Node.js v16.14.0 binary file for arm64 |

## 1.1.0 - 2022-03-05

- 03c92ce: improve experience for querying remote projects
- a33ba39: fix bug that occurs when querying absolute path prefix

## 1.0.0 - 2022-02-11

First version.

- Support searching projects from the local disk.
- Support searching projects from the workspace storage of Visual Studio Code.
- Provide a File Action "Open in Visual Studio Code" in Alfred.

