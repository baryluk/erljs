#!/usr/bin/env escript
%% -*- erlang -*-
%%! -pa erl_src/ -smp enable -sname erljs_compil_all -mnesia debug verbose


% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

main(_Args) ->

	ok = shell_default:cd("erl_src"),

	% prepare for conversion of all modules
	{ok, json_simple} = shell_default:c(json_simple),
	{ok, erljs_compiler} = shell_default:c(erljs_compiler),
	{ok, erljs_compile_all} = shell_default:c(erljs_compile_all),

	%{ok, erljs} = shell_default:c(erljs),
	%{ok, erljs_dom} = shell_default:c(erljs_dom),
	%{ok, erljs_html} = shell_default:c(erljs_html),

	ok = shell_default:cd(".."),
	
	% convert all standard and few non-standard modules
	erljs_compile_all:ca(),
	
	% prepare for generating tests
	ok = shell_default:cd("erl_src"),
	{ok, erljs_tests} = shell_default:c(erljs_tests),
	ok = shell_default:cd(".."),

	ok = shell_default:cd("examples/devel"),
	DevExamples = [example, example_floats, example_funs, example_eh, example_messages, example_binaries],
	[ shell_default:c(M) || M <- DevExamples ],
	ok = shell_default:cd("../.."),


	Tests = [tests_auto, testy_parsowanie, testy_float, tests_binaries],

	% generate tests and reference result wrapper and checker
	ok = shell_default:cd("tests"),
	erljs_tests:cl(Tests),
	ok = shell_default:cd(".."),
	
	% convert all generated tests
	Tests2 = [ "tests/" ++ atom_to_list(M) ++ ".beam" || M <- Tests ],
	erljs_compiler:cl(Tests2),

	io:format("~n~nBuild complete.~n"),

	ok.
