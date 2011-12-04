#!/usr/bin/env escript
%% -*- erlang -*-
%%! -smp enable -sname erljs_compil_all -mnesia debug verbose


% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

main(_Args) ->
	% prepare for conversion of all modules
	{ok, erljs} = shell_default:c(erljs),
	
	% convert all standard and few non-standard modules
	erljs:ca(),
	
	
	% prepare for generating tests
	{ok, erljs_tests} = c(erljs_tests),
	
	% generate tests and reference result wrapper and checker
	erljs_tests:cl([tests_auto, tests_parsowanie, tests_float, tests_binaries]),
	
	% convert all generated tests
	ok = erljs:cl([tests_auto, tests_parswowanie, tests_float, tests_binaries]),
	
	ok.
