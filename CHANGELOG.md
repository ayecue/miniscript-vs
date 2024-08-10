# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 12-11-2023

- port greybel-vs to miniscript-vs

## [0.1.1] - 12-11-2023

- change readme

## [0.1.2] - 13-11-2023

- add missing time intrinsic

## [0.2.0] - 14-11-2023

- add %= and ^= operators
- support else after return in single-line if
- support multiline comparisons
- fix issue with call statement without parentheses and first negative arg

## [0.3.0] - 15-11-2023

- add missing meta info for pull on maps
- fix numeric logical expression
- fix failing cases for hasIndex and indexOf (test suite)
- fix failing cases for insert (test suite)
- fix failing cases for remove (test suite)
- fix failing cases for split (test suite)
- fix failing cases for round (test suite)
- fix failing cases for pop (test suite)
- fix failing cases for sort (test suite)
- change hashing and deep equal approach
- fix failing cases for replace (test suite)

## [0.3.1] - 15-11-2023

- fix meta map pull signature
- remove specific greyscript type logic
- include file icon - thanks for the suggestion to [@juh9870](https://github.com/juh9870) - related to [#5](https://github.com/ayecue/miniscript-vs/issues/5)

## [0.3.2] - 16.11.2023

- fix failure when sortKey was not existing
- support detection of all single line comments above function declaration

## [0.4.0] - 22.11.2023

- replacing recursive interpreter with bytecode generator + vm to improve performance
- due to the new interpreter the stacktrace should be more accurate - thanks for reporting to [@Olipro](https://github.com/Olipro) - related to [#109](https://github.com/ayecue/greybel-vs/issues/109)

## [0.4.1] - 23.11.2023

- pass debug mode to interpreter when using "debug file"

## [0.4.2] - 23.11.2023

- fix error message popup when instruction is internal

## [0.4.3] - 24.11.2023

- fix prepare error on execute not showing line
- do not allow frame pop on global frame

## [0.4.4] - 26.11.2023

- fix for iterations combined with returns causing the iterator stack not to pop

## [0.4.5] - 30.11.2023

- fix self not being reassignable within frame

## [0.4.6] - 13.12.2023

- use dot as resolve trigger for autocompletion handler + minor adjustments
- transform several text editor commands into normal commands
- update meta to improve autocomplete

## [0.4.7] - 14.12.2023

- use active document for build and refresh if there is no event uri available

## [0.4.8] - 27.01.2024

- make gotoError and transforms invisible in command palette since those require the context of an editor
- add pointer for current active instruction for stacktrace
- while minimizing check if hasIndex value exists in namespaces otherwise falls back to not otimized value
- fix index expression to replicate [#89](https://github.com/JoeStrout/miniscript/issues/89) behavior of MiniScript
- add frame limit to interpreter to prevent crashing VSCode due to infinite recursion caused by a script

## [0.4.9] - 19.02.2024

- allow super being reassigned
- fix super not using proper origin when calling a function of parent
- set super to null if there is no parent class
- improve parser recovery from invalid syntax
- use backpatching to enable similar MiniScript parsing of blocks

## [0.4.10] - 16.03.2024

- fix certain cases of open blocks causing errors in unsafe parsing mode
- add #file and #line keyword for debugging

## [0.4.11] - 02.04.2024

- add NaN check for numeric literal scan in order to show syntax errors on invalid numbers
- include lexer exceptions in diagnostics

## [0.5.0] - 21.04.2024

- ignore return statement when it's not within function scope
- still execute method which is called in return statement within global scope
- major improvement of interpreter in regards of performance by rewriting and optimizing parts of the bytecode-generator, internal hash-map, hashing and more
- fix parsing of add sub expression while being a command

## [0.5.1] - 25.04.2024

- fix bytecode generator source assignment which caused the interpreter to show the wrong file when using imports

## [0.5.2] - 27.05.2024

- update rnd method to only return the first generated value of a seed and not continuously generate new values of one seed to properly resemble the original MiniScript behaviour
- fix behaviour of val intrinsic, properly parse strings which have commas prior to dot
- fix lexer which could for certain character under certain conditions cause inifinite loops

## [0.5.3] - 18.06.2024

- improve beautifier formatting - related to [#4](https://github.com/ayecue/miniscript-vs/issues/4)
- add formatter - related to [#4](https://github.com/ayecue/miniscript-vs/issues/4)
- fix behavior of val intrinsic on leading comma
- support funcRef intrinsic
- add repeat keyword
- implement new type manager which keeps better track of types and properties
- fix and improve documentation regarding intrinsics
- add description to signature help provider
- support defining argument and return types for functions through comments to which the hover and auto complete features will react accordingly

## [0.5.4] - 20.06.2024

- add parenthesis for compound assignment
- fix beautifier compound assignment regarding precedence
- add transpiler beautifier option to keep parentheses
- add transpiler beautifier option to set indendation by either tab or whitespace
- add transpiler beautifier option to set amount of whitespaces for indentation

## [0.5.5] - 20.06.2024

- add dev mode for transpiler so that it won't transpile code into production ready code, meaning that for example includes or imports won't be transpiled via formatter but rather by build command

## [0.5.6] - 26.06.2024

- minor optimizations regarding type resolver such as resolving types through parentheses, keeping api definitions apart from custom definitions preventing unwanted merged definitions, using a proxy container for signature definitions and fixing line overriding for identifier causing to use wrong start lines

## [0.5.7] - 01.07.2024

- add super keyword to type-analyzer
- fix member expression containing new unary when resolving type
- only use shallow copy when copying entity to avoid memory exhaustion for type-analyzer
- properly resolve members of scope variables and api definitions for type-analyzer

## [0.5.8] - 14.07.2024

- fix resolving of namespaces
- optimize deep-hash and deep-equal
- improve error message when path not found in type
- improve definition provider

## [0.5.9] - 15.07.2024

- fix autocomplete including map related intrinsics in general

## [0.5.10] - 15.07.2024

- properly check in type-analyzer if string in index is valid identifier
- let type-analyzer resolve isa expressions as number

## [0.5.11] - 17.07.2024

- let type-analyzer resolve logical expressions as number
- let type-analyzer set proper label for binary expression

## [0.5.12] - 18.07.2024

- keep multiline comments in devMode when beautifying
- fix beautify regarding multiline comments
- fix beautify when having multiple commands in one line via semicolon
- fix signature parser for multiline comments
- add support for envar, file and line in type-analyzer

## [0.5.13] - 20.07.2024

- optimize build size

## [0.5.14] - 22.07.2024

- optimize interpreter task schedule, resulting in faster execution

## [0.5.15] - 24.07.2024

- fix beautify indent on shorthand if else
- add inject expression

## [0.5.16] - 01.08.2024

- show proper error message when trying to call propery from null value instead of throwing ".getWithOrigin is not a function"
- replace usage of fs paths with vscode uris to prepare for language server port

## [0.5.17] - 05.08.2024

- fix "Error: EINVAL: invalid argument, mkdir" error on build
- fix "Edit is only valid while callback runs" on transform
- fix bytecode generator to properly add negative numbers as default parameters, "function myFunc(index = -1)" works now
- properly support grouped comparisons, "0" <= numberStr <= "9" works now
- fix metaxploit load not checking if returned entity is actually a file
- fix beautify not handling multiline expressions in block openers correctly resulting in a bunch of additional new lines each beautify
- minor performance improvements in parser