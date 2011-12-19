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
		[ "erl_lib_core/stdlib/src/" ++ atom_to_list(M) ++ ".erl" || M <- [
			%math,
			array,
			base64,
			binary,
			calendar,
			random,
			lists,
			orddict,
			ordsets,
			string,
			unicode,
			queue,
			dict,
			proplists,
			sets,
			sofs,
			gb_trees,
			gb_sets,
			regexp
		] ]
		++
		[ "erl_lib_core/stdlib/src/" ++ atom_to_list(M) ++ ".erl" || M <- [
			supervisor,
			supervisor_bridge,
			proc_lib,
			gen,
			gen_event,
			gen_fsm,
			gen_server,

			sys,

			pg,
			pool,
			%slave,

			lib,

			io,
			io_lib,
			io_lib_format,
			io_lib_fread,
			io_lib_pretty,

			error_logger_file_h,
			error_logger_tty_h,
			log_mf_h,

			filelib,
			filename,

			edlin,
			edlin_expand,

			shell,
			shell_default,
			c,
			epp,
			eval_bits,
			erl_bits, % potrzebne includy
			erl_compile, % potrzebne includy
			erl_eval,
			erl_expand_records,
			erl_internal,
			erl_lint,
			erl_parse,
			erl_posix_msg,
			erl_pp,
			erl_scan,
			erl_tar,
			beam_lib,

			ms_transform,

			timer,
			ets,
			dets,
			dets_server,
			dets_sup,
			dets_utils,
			dets_v8,
			dets_v9,
			qlc,
			qlc_pt,

			digraph,
			digraph_utils,

			otp_internal

%			zip
		] ]
		++
		[ "erl_lib_core/kernel/src/" ++ atom_to_list(M) ++ ".erl" || M <- [
			error_logger
		] ]
		++
		[ "erl_lib_core/erts/src/" ++ atom_to_list(M) ++ ".erl" || M <- [
			erlang,
			otp_ring0,
			init
			% erl_prim_loader
		] ]
		++
		[
			"erl_lib_core/erts/ebin-org/erl_prim_loader.beam"
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


	Opts2 = [
		{i, "erl_lib_core/kernel/include"},
		{i, "erl_lib_core/stdlib/include"}
	],
	erljs_compiler:cl(L, Opts ++ Opts2).
