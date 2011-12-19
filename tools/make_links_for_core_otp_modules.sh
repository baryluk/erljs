#!/bin/bash

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

ERL_TOP=${ERL_TOP:-/usr/lib/erlang}
ERL_TOP_LIB="${ERL_TOP}/lib"


MODULES="random string proplists dict gb_trees gb_sets orddict ordsets queue sets regexp"
MODULES="${MODULES} sys proc_lib gen gen_event gen_fsm gen_server supervisor supervisor_bridge"
MODULES="${MODULES} erl_bits erl_compile erl_eval erl_expand_records erl_internal erl_lint erl_parse erl_posix_msg erl_pp erl_scan erl_tar"
MODULES="${MODULES} epp"
MODULES="${MODULES} timer calendar array base64"
MODULES="${MODULES} ets"
# Note: do not add 'lists' module here. it needs to be patched at the end

MODULES="array
base64
beam_lib
binary
calendar
c
dets dets_server dets_sup dets_utils dets_v8 dets_v9
dict
digraph digraph_utils
edlin edlin_expand
epp
erl_bits erl_compile erl_eval erl_expand_records erl_internal erl_lint erl_parse erl_posix_msg erl_pp erl_scan erl_tar
error_logger_file_h error_logger_tty_h
escript
ets
eval_bits
filelib filename file_sorter
gb_sets gb_trees
gen gen_event gen_fsm gen_server
io io_lib io_lib_format io_lib_fread io_lib_pretty
lib
log_mf_h
math
ms_transform
orddict ordsets
otp_internal pg pool proc_lib
proplists
qlc qlc_pt
queue
random
regexp
sets
shell_default shell slave sofs
string
supervisor_bridge supervisor
sys
timer unicode zip"

# TODO re
# NOT win32reg
# SEPARATLY lists

MODULES_ADD="dets.hrl erl_parse.yrl"

if [ ! -d "./erl_lib_core" ]; then
	echo "Please run ./tools/make_links_for_core_top_module.sh from top directory of erljs" >&2
	exit 1
fi

if [ ! -d "./erl_lib_core/stdlib/src" ]; then
	mkdir -p "./erl_lib_core/stdlib/src"
fi
if [ ! -d "./erl_lib_core/kernel/src" ]; then
	mkdir -p "./erl_lib_core/kernel/src"
fi
if [ ! -d "./erl_lib_core/erts/src" ]; then
	mkdir -p "./erl_lib_core/erts/src"
fi

echo "Creating links for modules from stdlib application" >&2
for MODULE in ${MODULES};
do
	if [ -L "./erl_lib_core/stdlib/src/${MODULE}.erl" ]; then
		rm "./erl_lib_core/stdlib/src/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/stdlib-*/src/"${MODULE}.erl" "./erl_lib_core/stdlib/src/"
done
for FILE in ${MODULES_ADD};
do
	if [ -L "./erl_lib_core/stdlib/src/${FILE}" ]; then
		rm "./erl_lib_core/stdlib/src/${FILE}"
	fi
	ln -v -s ${ERL_TOP_LIB}/stdlib-*/"src/${FILE}" "./erl_lib_core/stdlib/src/"
done
if [ -L "./erl_lib_core/stdlib/include" ]; then
	rm "./erl_lib_core/stdlib/include"
fi
ln -v -s ${ERL_TOP_LIB}/stdlib-*/include "./erl_lib_core/stdlib/"

echo "Creating links for modules from kernel application" >&2
MODULES2="error_logger "
for MODULE in ${MODULES2};
do
	if [ -L "./erl_lib_core/kernel/src/${MODULE}.erl" ]; then
		rm "./erl_lib_core/kernel/src/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/kernel-*/src/${MODULE}.erl "./erl_lib_core/kernel/src/"
done
ln -v -s ${ERL_TOP_LIB}/kernel-*/include "./erl_lib_core/kernel/"

echo "Creating links for modules from erts application" >&2
# usefull for get_argument/1, etc. 
MODULES3="otp_ring0 init erl_prim_loader erlang"
for MODULE in ${MODULES3};
do
	if [ -L "./erl_lib_core/erts/src/${MODULE}.erl" ]; then
		rm "./erl_lib_core/erts/src/${MODULE}.erl"
	fi
	ln -v -s ${ERL_TOP_LIB}/erts-*/src/${MODULE}.erl "./erl_lib_core/erts/src/"
done
mkdir -p "./erl_lib_core/erts/ebin-org"
if [ -L "./erl_lib_core/erts/ebin-org/erl_prim_loader.beam" ]; then
	rm "./erl_lib_core/erts/ebin-org/erl_prim_loader.beam"
fi
ln -v -s ${ERL_TOP_LIB}/erts-*/ebin/erl_prim_loader.beam "./erl_lib_core/erts/ebin-org/"


echo "Copying and patching lists.erl from stdlib application (it should be safe to overwrite existing file)" >&2
cp -v -i ${ERL_TOP_LIB}/stdlib-*/src/lists.erl "./erl_lib_core/stdlib/src/lists.erl"
(cd ./erl_lib_core/stdlib/; patch -p1 < ../lists-erl.patch)

exit 0
