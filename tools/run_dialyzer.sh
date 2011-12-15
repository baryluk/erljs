#!/bin/sh

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

if [ ! -f ~/.dialyzer_plt ]; then
dialyzer --build_plt --apps erts kernel stdlib mnesia compiler \
	crypto hipe inets parsetools sasl xmerl debugger common_test \
	eunit edoc docbuilder tools syntax_tools ssh wx ssl snmp gs \
	test_server runtime_tools webtool observer public_key et
fi

cd erl_src
dialyzer json_simple.erl erljs_compiler.erl erljs_compile_all.erl erljs_tests.erl erljs.erl
