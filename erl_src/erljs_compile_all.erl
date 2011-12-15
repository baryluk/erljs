-module(erljs_compile_all).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-export([ca/0, ca/1]).


-spec ca() ->
	[{'ok', [any(), ...], [any(), ...]}].

% compile all standard modules
ca() ->
	ca([]).

-spec ca([atom() | {atom(), _} | {'d', atom(), _}]) ->
	[{'ok', [any(), ...], [any(), ...]}].

ca(Opts) ->
	L =
		[ "examples/devel/" ++ atom_to_list(M) ++ ".erl" || M <- [
			example,
			example_binaries,
			example_eh,
			example_floats,
			example_funs,
			example_messages
		] ]
		++
		[ "erl_lib_core/stdlib/" ++ atom_to_list(M) ++ ".erl" || M <- [
			random,
			lists,
			orddict,
			ordsets,
			string,
			queue,
			dict,
			proplists,
			sets,
			gb_trees,
			gb_sets,
			regexp
		] ]
		++
		[ "erl_lib_core/stdlib/" ++ atom_to_list(M) ++ ".erl" || M <- [
			supervisor,
			supervisor_bridge,
			proc_lib,
			gen,
			gen_event,
			gen_fsm,
			gen_server,

			sys,

			%erl_bits, % potrzebne includy
			%erl_compile, % potrzebne includy
			erl_eval,
			erl_expand_records,
			erl_internal,
			erl_lint,
			erl_parse,
			erl_posix_msg,
			erl_pp,
			erl_scan,
			erl_tar
		] ]
		++
		[ "erl_lib_core/kernel/" ++ atom_to_list(M) ++ ".erl" || M <- [
			error_logger
		] ]
		++
		[ "erl_lib_core/erts/" ++ atom_to_list(M) ++ ".erl" || M <- [
			erlang,
			otp_ring0,
			init
			% erl_prim_loader
		] ]
		++
		[
			"/usr/lib/erlang/lib/erts-5.8.5/ebin/erl_prim_loader.beam"
		]
		++
		[
			"erl_src/erljs_kernel.erl"
		]
		++
		[ "tests/" ++ atom_to_list(M) ++ ".erl" || M <- [
		%	tests_auto,
			random_term
		] ]
		++
		[ "examples/" ++ atom_to_list(M) ++ ".erl" || M <- [
			gensup_test,
			genser_manybuttons,
			genser_calculatepi
		] ],


	erljs_compiler:cl(L, Opts).
