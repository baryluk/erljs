#!/usr/bin/env escript
%% -*- erlang -*-
%%! -smp enable -sname erljs_compil_all -mnesia debug verbose

main(_Args) ->
	{ok, erljs} = shell_default:c(erljs),
	erljs:ca().

% todo generate all tests for ["tests_auto", module_tests_auto],
