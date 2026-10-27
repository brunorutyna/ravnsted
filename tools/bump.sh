#!/bin/sh
# Give css/js a new ?v= stamp so phones load the new files at once instead of a cached copy,
# and write version.txt so an open game notices the new version and offers a reload.
d="$(dirname "$0")/.."
v=$(date +%Y%m%d%H%M%S)
sed -i -E "s#(href=\"css/style\.css)(\?v=[0-9]+)?\"#\1?v=$v\"#; s#(src=\"js/[a-z0-9]+\.js)(\?v=[0-9]+)?\"#\1?v=$v\"#" "$d/index.html"
sed -i -E "s/window.VERSION = '[0-9]+'/window.VERSION = '$v'/" "$d/index.html"
echo "$v" > "$d/version.txt"
echo "stamped $v"
