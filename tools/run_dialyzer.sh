#!/bin/bash

dialyzer --build_plt --apps erts kernel stdlib mnesia compiler crypto hipe inets parsetools sasl xmerl debugger common_test eunit edoc docbuilder tools syntax_tools ssh wx ssl snmp gs test_server runtime_tools webtool observer public_key et

#dialyzer erljs_tests.erl  erljs.erl  json_simple.erl 
