#!/bin/bash

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

ERL_TOP=${ERL_TOP:-/usr/lib/erlang}
ERL_TOP_LIB="${ERL_TOP}/lib"


MODULES="random string proplists dict gb_trees gb_sets orddict ordsets queue sets regexp"
MODULES="${MODULES} sys proc_lib gen gen_event gen_fsm gen_server supervisor supervisor_bridge"
# Note: do not add 'lists' module here. it needs to be patched at the end

if [ ! -d "./erl_lib_core" ]; then
	echo "Please run ./tools/make_links_for_core_top_module.sh from top directory of erljs" >&2
	exit 1
fi

if [ ! -d "./erl_lib_core/stdlib" ]; then
	mkdir "./erl_lib_core/stdlib"
fi
if [ ! -d "./erl_lib_core/kernel" ]; then
	mkdir "./erl_lib_core/kernel"
fi
if [ ! -d "./erl_lib_core/erts" ]; then
	mkdir "./erl_lib_core/erts"
fi

echo "Creating links for modules from stdlib application" >&2
for MODULE in ${MODULES};
do
	if [ -L "./erl_lib_core/stdlib/${MODULE}.erl" ]; then
		rm "./erl_lib_core/stdlib/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/stdlib-*/src/${MODULE}.erl "./erl_lib_core/stdlib/"
done

echo "Creating links for modules from kernel application" >&2
MODULES2="error_logger "
for MODULE in ${MODULES2};
do
	if [ -L "./erl_lib_core/kernel/${MODULE}.erl" ]; then
		rm "./erl_lib_core/kernel/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/kernel-*/src/${MODULE}.erl "./erl_lib_core/kernel/"
done

echo "Creating links for modules from erts application" >&2
# usefull for get_argument/1, etc. 
MODULES3="otp_ring0 init erl_prim_loader erlang"
for MODULE in ${MODULES3};
do
	if [ -L "./erl_lib_core/erts/${MODULE}.erl" ]; then
		rm "./erl_lib_core/erts/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/erts-*/src/${MODULE}.erl "./erl_lib_core/erts/"
done


echo "Copying and patching lists.erl from stdlib application (it should be safe to overwrite existing file)" >&2
cp -v -i ${ERL_TOP_LIB}/stdlib-*/src/lists.erl "./erl_lib_core/stdlib/lists.erl"
(cd ./erl_lib_core/stdlib/; patch -p0 < ../lists-erl.patch)

exit 0
