#!/bin/bash

MODULES="random string proplists dict gb_trees gb_sets orddict ordsets queue sets regexp"
MODULES="${MODULES} sys proc_lib gen gen_event gen_fsm gen_server supervisor supervisor_bridge"

#lists # lists.erl is slightly different

for MODULE in ${MODULES};
do
	if [ -L "${MODULE}.erl" ]; then
		rm "${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/stdlib-*/src/${MODULE}.erl
done

MODULES2="error_logger "
for MODULE in ${MODULES2};
do
	if [ -L "${MODULE}.erl" ]; then
		rm "${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/kernel-*/src/${MODULE}.erl
done

# usefull for get_argument/1, etc. 
MODULES3="otp_ring0 init erl_prim_loader erlang"
for MODULE in ${MODULES3};
do
	if [ -L "${MODULE}.erl" ]; then
		rm "${MODULE}.erl"
	fi
	ln -v -s /usr/lib/erlang/lib/erts-*/src/${MODULE}.erl
done


cp -i /usr/lib/erlang/lib/stdlib-*/src/lists.erl lists.erl
patch -p0 < lists-erl.patch
