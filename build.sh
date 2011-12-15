#!/bin/sh

./tools/make_links_for_core_otp_modules.sh

if [ ! -d "js_lib/javascript-stacktrace" ]; then
echo "Cloning javascript-stacktrace into js_lib/javascript-stacktrace."
# Backup repository at https://github.com/baryluk/javascript-stacktrace
(cd js_lib; git clone git://github.com/eriwen/javascript-stacktrace.git)
else
echo "js_lib/javascript-stacktrace already exists. Skiping cloning."
fi

./tools/compile_all.escript

echo
echo "Build is complete (or not), but still few things needs to be done manually..."
echo
echo "You may need to update:"
echo "    erljs_html/erljs.html (<script src=...> tags, which loads .beam.js files)"
echo "    js_src/erljs_code.js (nacassary mappings in all_modules array)"
echo 
echo "For your conviniance, both <script ...> tags, and all_modules array, was printed above by compiler"
echo "It was however printed twice, once for main modules, and once for tests."
echo "Make sure to copie both sets, and merge them in order."
echo
echo "In future, both of this steps will be not nacassary (after implementing proper code loader)."
echo "But make sure they are correct now. If you are compiling just cloned repository,"
echo "then supplied erljs.html and erljs_code.js files, should be correct."
echo
