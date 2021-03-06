#!/bin/bash

pkg="angular-skyhook"

usage () {
  echo "usage: $0 [--serve] [--serve-only] [--no-examples] [--port <default is 8080>]"
}

fail () {
    echo "failed on: $@"
    echo "exiting"
    exit 1
}

serve() {
    echo "serving ./out-docs/ on http://localhost:$PORT"
    (cd ./out-docs && python3 -m http.server $PORT)
    exit
}

SERVE=0
SERVE_ONLY=0
PORT=8080

if [ -n "$TRAVIS" ]; then
    SERVE=0
    SERVE_ONLY=0
else
    while [ "$1" != "" ]; do
        case $1 in
            -h | --help)
                usage
                exit
                ;;
            --serve)
                SERVE=1
                ;;
            --serve-only)
                SERVE_ONLY=1
                ;;
            --port)
                PORT=$2
                shift
                ;;
            *)
                echo "ERROR: unknown parameter \"$1\""
                usage
                exit 1
                ;;
        esac
        shift
    done
fi

if [ $SERVE_ONLY -eq 1 ]; then
    serve
fi

DIR=$(dirname "$0")
output="$DIR/out-docs"
skyhook="$DIR/packages/angular-skyhook"
multi_backend="$DIR/packages/angular-skyhook-multi-backend"
examples="$DIR/packages/examples"

EXAMPLES_TASK="local-docs"
if [ $TRAVIS == "true" ]; then
  EXAMPLES_TASK="gh-pages"
fi

# Now, if we're running travis, we only want to build docs on master proper.
# Anything less (e.g. PRs to master) and we can go faster by building in dev mode
# and ignoring the docs (which never fail basically).
# This saves about 1-2 minutes per non-master build.

if [ "$TRAVIS_BRANCH" != "master" ] || [ "$TRAVIS_PULL_REQUEST" != "false" ]; then
    set -euxo pipefail
    (cd "$examples" && yarn run fast)
    exit
fi

build() {
    set -euxo pipefail

    rm -rf out-docs
    rm -rf "$skyhook/documentation"

    (cd "$skyhook" && yarn run docs)

    # move main docs into output
    (mv "$skyhook/documentation" "$output")

    # build multi-backend docs
    (cd $multi_backend && yarn run docs)

    # move multi-backend into output
    (mv "$multi_backend/documentation" "$output/angular-skyhook-multi-backend")

    # build examples
    (cd "$examples" && yarn run $EXAMPLES_TASK)

    # move examples into output
    (mv "$examples/dist/examples" "$output/examples")

    : "built successfully"
}

if [ $SERVE -eq 1 ]; then
    build
    serve
else
    build
fi

