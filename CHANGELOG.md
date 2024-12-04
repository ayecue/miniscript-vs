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

## [0.6.0] - 10.08.2024

- fix "Error: EINVAL: invalid argument, mkdir" error on build
- fix "Edit is only valid while callback runs" on transform
- fix bytecode generator to properly add negative numbers as default parameters, `function myFunc(index = -1)` works now
- fix handling of non literal comparisons such as biggerThan, biggerThanOrEqual, lessThan or lessThanEqual, `"23" < [42]` now correctly returns null
- properly support grouped comparisons, `"0" <= numberStr <= "9"` works now
- properly parse shorthands if those are containing a block
- fix beautify not handling multiline expressions in block openers correctly resulting in unwanted new lines
- fix beautify not properly appending comment if keepParentheses option is active
- fix beautify not handling if shorthands with function blocks in them correctly resulting in unwanted new lines
- minor performance improvements in parser

## [0.6.1] - 10.08.2024

- fix beautify not properly appending comment to index expression

## [0.6.2] - 11.08.2024

- fix beautify for if shorthand clause with comment
- fix beautify adding an unwanted new line to empty blocks
- fix beautify adding unwanted new lines for if shorthands with multiline expression towards end of block

## [0.6.3] - 11.08.2024

- fix goto error functionality not working due to latest uri changes

## [0.6.4] - 17.08.2024

- move IntelliSense functionality into miniscript-languageserver
- fix IntelliSense of web version of extension
- fix beautify causing misbehaviour when list/map one-liners had comment at end

## [0.6.5] - 19.08.2024

- allow binary expression to be executed as statement
- cleanup open handles of binary/logical expression that are statements

## [0.6.6] - 19.08.2024

- reduce lsp document manager tick frequency

## [0.6.7] - 19.08.2024

- properly handle missing files in ls

## [0.6.8] - 20.08.2024

- fix handling textDocument/documentSymbol failed error in ls, which was caused when there was invalid syntax at some point

## [0.6.9] - 31.08.2024

- fix tooltip formatting logic which could potentially cause "Cannot read properties of null"

## [0.6.10] - 31.08.2024

- properly handle if workspaces are null which could potentially cause "Cannot read properties of null"

## [0.6.11] - 02.09.2024

- improve handling of workspaces in extension and lsp

## [0.6.12] - 02.09.2024

- fix error related to type analyzer that could cause "Cannot read properties of undefined (reading 'start')" in lsp

## [0.6.13] - 03.09.2024

- fix beautify for parentheses and comments where a comment would be right after closing parenthese
- fix function argument recovery if invalid syntax was provided in function arguments
- rather fallback than throw error if leading slash is used but workpace is not available

## [0.7.0] - 13.09.2024

- refactor transformer in transpiler to improve transformations
- fix conflict with comments on beautify - related to [#53](https://github.com/ayecue/miniscript-vs/issues/53) - thanks for reporting to [@Xisec](https://github.com/Xisec)
- fix edge cases for variable optimizations on uglify
- fix edge cases for literal optimizations on uglify

## [0.7.1] - 13.09.2024

- fix globals shorthand identifier not getting injected when no literal optimization were happening - related to [#157](https://github.com/ayecue/greybel-js/issues/157) - thanks for reporting to [@smiley8D](https://github.com/smiley8D)
- fix behaviour of import op in runtime which caused it's payload to be called every time it was imported, instead it's only getting executed once now - related to [#222](https://github.com/ayecue/greybel-js/issues/222) - thanks for reporting to [@smiley8D](https://github.com/smiley8D)

## [0.7.2] - 27.10.2024

- properly handle values that cannot be iterated through on for loop
- fix type analyzer failing if slice expression was used after expression - related to [#255](https://github.com/ayecue/greybel-vs/issues/255) - thanks for reporting to [@ide1ta](https://github.com/ide1ta)

## [0.7.3] - 28.10.2024

- add custom types handling in type analyzer - related to [#198](https://github.com/ayecue/greybel-vs/issues/198)
- fix issue related to building of larger projects which could lead to maximum call stack size exceeded error to be thrown - thanks for reporting to [@ide1ta](https://github.com/ide1ta)

## [0.7.4] - 29.10.2024

- improve type resolve performance

## [0.7.5] - 03.11.2024

- improve type document merger performance

## [0.7.6] - 04.11.2024

- extend custom types with virtual properties
- allow "custom type" type docs above new statements
- show inherited properties of custom types properly in autocomplete

## [0.7.7] - 09.11.2024

- improve definition provider
- fix hover cache issue which resulted in tooltips not showing up
- improve autocompletion logic to use type analyzer merged document

## [0.7.8] - 10.11.2024

- properly handle cyclic isa defintions in type analyzer

## [0.7.9] - 10.11.2024

- include all custom type definitions of entities with multiple types

## [0.7.10] - 14.11.2024

- update extension readme

## [0.7.11] - 16.11.2024

- add check in symbol provider to filter map key values out
- forbid keywords in uglify namespaces optimization - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)
- fix for iteration namespace optimization of __i_idx variables - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)

## [0.7.12] - 24.11.2024

- fix literal optimization for negative numeric values - thanks for reporting to [@linuxgruven](https://github.com/linuxgruven)

## [0.7.13] - 28.11.2024

- extend type analyzer with workspace strategy

## [0.7.14] - 01.12.2024

- minor improvement to assumption logic of non existing properties

## [0.7.15] - 04.12.2024

- remove map and list properties from assignment registry resulting in less noise within the symbol provider
- add new entity kinds to improve visibility of interal intrinsics in auto complete