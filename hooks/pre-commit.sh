#!/bin/sh

files=$(git diff --name-only --diff-filter=ACM | grep "^src/.*js$")
if [ "$files" = "" ]; then
    exit 0 
fi

pass=true

echo "\nValidating JavaScript:\n"

for file in ${files}; do
    report=$(jshint ${file} )
    result=$(${report} | grep "${file} is OK")
    echo "${report}"
    if [ "$result" != "" ]; then
        echo "\t\033[32mJSLint Passed: ${file}\033[0m"
    else
        echo "\t\033[31mJSLint Failed: ${file}\033[0m"
        pass=false
    fi
done

echo "\nJavaScript validation complete\n"

if ! $pass; then
    echo "\033[41mCOMMIT FAILED:\033[0m Your commit contains files that should pass JSHint but do not. Please fix the JSHint errors and try again.\n"
    exit 1
else
    echo "\033[42mCOMMIT SUCCEEDED\033[0m\n"
fi