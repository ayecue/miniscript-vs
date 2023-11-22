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