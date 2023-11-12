# miniscript-vs

Toolkit for [MiniScript](https://miniscript.org/). Includes highlighting, code execution, bundling and minifying among other features. Check out the [changelog](https://github.com/ayecue/miniscript-vs/blob/main/CHANGELOG.md) to get information about the latest changes.

Ported over from [greybel-vs](https://github.com/ayecue/greybel-vs).

## Usage

Automatically detects `.ms` files.

Commands available (`CTRL+SHIFT+P`):
- `MiniScript: Build` - [info](#build)
- `MiniScript: Goto Error` - [info](#goto-error)
- `MiniScript: Transform to clipboard` - [info](#transform)
- `MiniScript: Transform` - [info](#transform)
- `MiniScript: Minify` - Shortcut for [info](#transform). Will use minify as build type.
- `MiniScript: Beautify` - Shortcut for [info](#transform). Will use beautify as build type.
- `MiniScript: Refresh` - [info](#refresh)

You can also access most of the commands via the context menu.

Do not forget to set up your plugin to your needs. The following settings are available:

- Activate/Deactivate
    - Autocomplete
    - Hoverdocs
- Transpiler specific
    - Build type
    - Disable literals optimization
    - Disable namespaces optimization
    - Environment variables
    - Excluded namespaces when optimizing
    - Obfuscation
- Interpreter specific
    - Environment variables

## Features

- Syntax Highlighting
- [Transform](#transform)
- [Build](#build)
- [Interpreter](#interpreter)
- [Debugger](#debugger)
- [Goto Error](#goto-error)
- [Providers](#supporting-providers)
    - [Autocompletion](#autocompletion-provider)
    - [Hover Tooltips](#hover-tooltips-provider)
    - [Diagnostics](#diagnostics-provider)
    - [Symbol](#symbol-provider)
    - [Definition](#definition-provider)

### Build

Transforms and bundles your files. It has three possible transformation types (Default, Uglify and Beautify) and supports environment variables as well.

#### Dependency Management (Transpiler)

This extension enables you to split your code into different files which is useful to keep readability and also to make reusable code.

Cyclic dependencies will be detected as well. In case there is one an error will be thrown indicating which file is causing it.

##### Import

Used to import exported namespaces from a file. Features of this import functionality:
- supports relative imports
- only loads code when required
- does not pollute global scope
- only gets imported once regardless of how many times it got imported
- only exports what you want

You can take a look at the [example code](/example/import) to get a better idea of how to use this feature.

##### Include

Used to import the content of a file. Features of this import functionality:
- supports relative includes
- very easy to use
- will pollute global scope
- will include the content of a file every time, which may cause redundant code

To get a better idea you can take a look at the following [example code](/example/include).

#### Environment Variables (Transpiler)

This extension supports the injection of environment variables while transpiling. The environment variables can be configured by using the extension settings.

Here is an [example](/example/environment-variables) of environment variable injection.

#### Syntax

Keep in mind that the following syntax is not valid in MiniScript. The transpiler can be used to transform code into valid MiniScript.

### No trailing comma is required in maps or lists
```
myList = [
	false,
	null
]

myMap = {
	"test": {
		"level2": {
			"bar": true
		}
	}
}
```

### Block comment
```
/*
	My block comment
*/
print("test")
```

### Transform

Transform is pretty much a simplified [build](#build). It will only transform the file at hand and ignore any imports.

### Interpreter

Executes MiniScript code. Supports all default MiniScript intrinsics. Also features a [debugger](#debugger).

![Start debug](https://github.com/ayecue/miniscript-vs/blob/main/assets/start-debug.png?raw=true "Start debug")

#### Dependency Management (Interpreter)

Dependencies will be dynamically loaded into the execution without any limitations. Cyclic dependencies are supported as well.

#### Environment Variables (Interpreter)

This extension supports the injection of environment variables while executing code. The environment variables can be configured by using the extension settings.

Here is an [example](/example/environment-variables) of environment variable injection.

### Debugger

Enables you to set breakpoints, run code in a breakpoint context, jump to the next line of execution etc. Generally helpful if you want to debug your code.

![Breakpoint](https://github.com/ayecue/miniscript-vs/blob/main/assets/breakpoint.png?raw=true "Breakpoint")

Keep in mind to set the breakpoint on a non-empty line. Otherwise, it will just skip that breakpoint.

![Active breakpoint](https://github.com/ayecue/miniscript-vs/blob/main/assets/active-breakpoint.png?raw=true "Active breakpoint")

A REPL is also available while executing the script or having an active breakpoint.

![REPL](https://github.com/ayecue/miniscript-vs/blob/main/assets/repl.png?raw=true "REPL")

### Refresh

Will refresh the AST Cache which is used for diagnostics, hover tooltips and autocompletion.

### Goto Error

Jumps to the next existing syntax error.

### Supporting providers

#### Autocompletion Provider

Figures out the current context and provides suggestions accordingly.

#### Hover Tooltips Provider

Returns information about functions/types.

#### Diagnostics Provider

Returns information about syntax errors in your code.

#### Symbol Provider

Returns list of all available symbols in the active file.

![Symbol](https://github.com/ayecue/miniscript-vs/blob/main/assets/symbols.png?raw=true "Symbol")

#### Definition Provider

Shows definitions in the currently active file and its dependencies.

![Definition](https://github.com/ayecue/miniscript-vs/blob/main/assets/definition-provider.png?raw=true "Definition")