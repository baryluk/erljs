#!/bin/bash

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

MODULES="erljs_kernel dict gb_sets ordsets regexp gb_trees proplists sets lists queue string orddict random tests_auto example example_messages"
MODULES="${MODULES} sys proc_lib gen gen_event gen_fsm gen_server"


ADDITIONAL="prototype.js javascript-stacktrace/stacktrace.js tests_auto.js erljs_code.js erljs_datatypes.js erljs_vm.js erljs_scheduler_list.js erljs_scheduler.js erljs_control.js"

(
for MODULE in $MODULES
do
cat erljs_code/${MODULE}.beam.js
done

for FILE in $ADDITIONAL
do
cat ${FILE}
done
) | grep -v -E '(^\s*//|^\s*$)' > gz/combined.js

gzip -v -c -9 gz/combined.js > gz/combined.jsgz
ls -l gz/combined.js gz/combined.jsgz
