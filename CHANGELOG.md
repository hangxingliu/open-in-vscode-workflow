# Changelog

## 2.0.0 - 2025-03-01

* c56d3fd: update this workflow for Alfred 5, provide a more convenient workflow configuration panel
  * Please read [this docs](https://github.com/hangxingliu/open-in-vscode-workflow/blob/main/docs/MIGRATING-FROM-V1-TO-V2.md) if you are migrating from the v1.x of this workflow.
* c248b43: add support for opening projects in different editors (VSCodium, Cursor, Vim, Neovim, ...) 
* 6270061: add support for choosing another editor to open the selected project by holding <kbd>⌘</kbd>
* 26f25f9: more project files have been added to the scanner list
* refactor the Node.js scripts in this workflow for more readability.

## 1.2.0 - 2024-01-26

* 359ce78: fix for initial results
* 00c3e16: fix parsing VSCode workspace URL

## 1.1.0 - 2022-03-05

- 03c92ce: improve experience for querying remote projects
- a33ba39: fix bug that occurs when querying absolute path prefix

## 1.0.0 - 2022-02-11

First version.

- Support searching projects from the local disk.
- Support searching projects from the workspace storage of Visual Studio Code.
- Provide a File Action "Open in Visual Studio Code" in Alfred.

