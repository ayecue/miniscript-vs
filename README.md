# miniscript-vs

A toolkit for [MiniScript](https://miniscript.org/) that provides features like syntax highlighting, code execution, bundling, and minification. For the latest changes, check the [changelog](https://github.com/ayecue/miniscript-vs/blob/main/CHANGELOG.md).

**Prefer a different editor?** The [MiniScript language server](https://github.com/ayecue/miniscript-languageserver/blob/main/packages/node/README.md) is also available and works with IDEs like Sublime Text, IntelliJ, nvim, and more. Setup examples are included in the repository.

## Usage

The plugin automatically detects `.ms` files.

Available commands (`CTRL+SHIFT+P`):
- `MiniScript: Build` - [info](#build)
- `MiniScript: Refresh` - [info](#refresh)

You can also access most commands from the context menu.

### Plugin Settings:
- **Activate/Deactivate**
  - Autocomplete
  - Hoverdocs
- **Transpiler Settings:**
  - Build type
  - Disable literals optimization
  - Disable namespaces optimization
  - Environment variables
  - Excluded namespaces for optimization
  - Obfuscation
- **Interpreter Settings:**
  - Environment variables

## Features

- Syntax Highlighting
- [Transform](#transform)
- [Build](#build)
- [Interpreter](#interpreter)
- [Debugger](#debugger)
- [Comment Docs](#comment-docs)
- [Goto Error](#goto-error)
- [Providers](#supporting-providers)

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

You can take a look at the [example code](https://github.com/ayecue/miniscript-vs/blob/main/example/import) to get a better idea of how to use this feature.

##### Include

Used to import the content of a file. Features of this import functionality:
- supports relative includes
- very easy to use
- will pollute global scope
- will include the content of a file every time, which may cause redundant code

To get a better idea you can take a look at the following [example code](https://github.com/ayecue/miniscript-vs/blob/main/example/include).

#### Environment Variables (Transpiler)

This extension supports the injection of environment variables while transpiling. The environment variables can be configured by using the extension settings.

Here is an [example](https://github.com/ayecue/miniscript-vs/blob/main/example/environment-variables) of environment variable injection.

#### Syntax

Keep in mind that the following syntax is not valid in MiniScript. The transpiler can be used to transform code into valid MiniScript.

##### No trailing comma is required in maps or lists
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

##### Block comment
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

Here is an [example](https://github.com/ayecue/miniscript-vs/blob/main/example/environment-variables) of environment variable injection.

### Debugger

Enables you to set breakpoints, run code in a breakpoint context, jump to the next line of execution etc. Generally helpful if you want to debug your code.

![Breakpoint](https://github.com/ayecue/miniscript-vs/blob/main/assets/breakpoint.png?raw=true "Breakpoint")

Keep in mind to set the breakpoint on a non-empty line. Otherwise, it will just skip that breakpoint.

![Active breakpoint](https://github.com/ayecue/miniscript-vs/blob/main/assets/active-breakpoint.png?raw=true "Active breakpoint")

A REPL is also available while executing the script or having an active breakpoint.

![REPL](https://github.com/ayecue/miniscript-vs/blob/main/assets/repl.png?raw=true "REPL")

### Comment Docs

Provide signatures for your functions to show better hover tooltips. Additionally, the provided return value will be recognized by the implemented type system, resulting in context-sensitive auto-complete suggestions.
```js
// Hello world
// I am **bold**
// @description Alternative description
// @example test("title", 123)
// @param {string} title - The title of the book.
// @param {string|number} author - The author of the book.
// @return {crypto} - Some info about return
test = function(test, abc)
  print(test)
end function
```
There is also the possibility of custom types. Here an example:
```js
// @type Bar
// @property {string} virtualMoo
// @property {string} nested.virtalMoo
Bar = {}
Bar.moo = ""

// Hello world
// I am **bold**
// @description Alternative description
// @example test("title", 123)
// @param {string} title - The title of the book.
// @param {string|number} author - The author of the book.
// @return {Bar} - Some info about return
Bar.test = function(test, abc)
	print("test")
	return self
end function

// @type Foo
Foo = new Bar
// @return {Foo}
Foo.New = function(message)
	result = new Foo
	return result
end function

myVar = Foo.New

myVar.test // shows defined signature of Bar.test on hover
myVar.virtualMoo // shows virtual property of type string on hover
myVar.nested.virtalMoo // shows nested virtual property of type string on hover
```

### Refresh

Will refresh the AST Cache which is used for diagnostics, hover tooltips and autocompletion.

### Goto Error

Jumps to the next existing syntax error.

### Supporting providers

This extension includes several IntelliSense providers to enhance your coding experience with GreyScript:

- **Autocompletion Provider**  
  Offers context-aware suggestions based on your current position in the code.

- **Signature Helper Provider**  
  Displays function signatures with parameter types and return values as you type, helping you use functions correctly and efficiently without needing to reference documentation.

- **Hover Tooltips Provider**  
  Displays helpful information about functions and types when you hover over them.

- **Diagnostics Provider**  
  Identifies and highlights syntax errors in your code for easier debugging.

- **Symbol Provider**  
  Lists all symbols available in the active file for easy navigation.  
  ![Symbol](https://github.com/ayecue/miniscript-vs/blob/main/assets/symbols.png?raw=true "Symbol")

- **Definition Provider**  
  Locates and displays definitions within the active file and its dependencies.  
  ![Definition](https://github.com/ayecue/miniscript-vs/blob/main/assets/definition-provider.png?raw=true "Definition")

- **Color Picker Provider**  
  Shows a color picker when you use color or mark tags in your code.