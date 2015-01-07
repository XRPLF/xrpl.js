Using Flow typechecking
=======================

Stage 1
-------
1. Add /* @flow */ to the top of a file you want to typecheck
2. Run `gulp typecheck` to generate a list of warnings

Stage 2
-------
When all source files have the /* @flow */ header and all warnings have been
addressed, remove the `weak: true` option from Gulpfile.js, run
`gulp typecheck` and remove all the additional warnings.

Stage 3
-------
Add type annotations to the source code and run `gulp strip` to strip
the type annotations and write the output to the `out` directory. After
type annotations are added, the program must be run from the `out` directory
because Node does not understand the annotations
