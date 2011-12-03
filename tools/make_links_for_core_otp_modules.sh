#!/bin/bash

set -e
set -v

MODULES="random string proplists dict gb_trees gb_sets orddict ordsets queue sets regexp"
MODULES="${MODULES} sys proc_lib gen gen_event gen_fsm gen_server supervisor supervisor_bridge"
# Note: do not add 'lists' module here. it needs to be patched at the end

if [ ! -d "./erl_lib_core/stdlib" ]; then
	mkdir "./erl_lib_core/stdlib"
fi
if [ ! -d "./erl_lib_core/kernel" ]; then
	mkdir "./erl_lib_core/kernel"
fi
if [ ! -d "./erl_lib_core/erts" ]; then
	mkdir "./erl_lib_core/erts"
fi

for MODULE in ${MODULES};
do
	if [ -L "./erl_lib_core/stdlib/${MODULE}.erl" ]; then
		rm "./erl_lib_core/stdlib/${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/stdlib-*/src/${MODULE}.erl "./erl_lib_core/stdlib/"
done

MODULES2="error_logger "
for MODULE in ${MODULES2};
do
	if [ -L "./erl_lib_core/kernel/${MODULE}.erl" ]; then
		rm "./erl_lib_core/kernel/${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/kernel-*/src/${MODULE}.erl "./erl_lib_core/kernel/"
done

# usefull for get_argument/1, etc. 
MODULES3="otp_ring0 init erl_prim_loader erlang"
for MODULE in ${MODULES3};
do
	if [ -L "./erl_lib_core/erts/${MODULE}.erl" ]; then
		rm "./erl_lib_core/erts/${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/erts-*/src/${MODULE}.erl "./erl_lib_core/erts/"
done


cp -i /usr/lib/erlang/lib/stdlib-*/src/lists.erl "./erl_lib_core/stdlib/lists.erl"
(cd ./erl_lib_core/stdlib/; patch -p0 < ../lists-erl.patch)
