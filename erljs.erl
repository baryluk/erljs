-module(erljs).

-compile([export_all]).

-export([
	ca/0, ca/1, % compile standard modules
	cl/1, cl/2, % compile given list of module
	c/1, c/2 % compile one module
]).

-define(HEAD, ["erljs, auto-generated at ",io_lib:format("~p",[erlang:localtime()]),", Witold Baryluk, 2010"]).

-define(HEADER, ok = file:write(File, ?HEAD)).

ca() ->
	ca([]).

ca(Opts) ->
	L = [
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
		example
	],
	cl(L,Opts).

cl(L) ->
	cl(L, []).

cl(L, Opts) ->
	M = [ c(M, Opts) || M <- L ],

	io:format("// ~s~n", [lists:flatten(?HEAD)]),
	io:format("var all_modules = [~n"),
	[ io:format("    [\"~s\", module_~s],~n", [M, M]) || M <- L ],
	io:format("];~n~n"),

	io:format("<!-- ~s -->~n", [lists:flatten(?HEAD)]),
	[ io:format(" <script src=\"erljs_code/~s.beam.js\" type=\"text/javascript\"> </script>~n", [M]) || M <- L ],
	io:format(" <script src=\"erljs_code.js\" type=\"text/javascript\"> </script>~n"),
	M.

c(Mod) ->
	c(Mod, []).

%% Encode module
c(Mod, Opts) ->
	ModName = if
		is_atom(Mod) -> atom_to_list(Mod);
		is_list(Mod) -> Mod
	end,

	Verbose = lists:member(verbose, Opts),

	% 'S' - will prdue File.S with assembler code.
	Opts2 = Opts ++ [debug_info,report,inline,{inline_size,24},warn_obsolete_guard],
	%Opts2 = Opts ++ [debug_info,report,warn_obsolete_guard],
	io:format("Recompiling: ~p with options ~p ~n", [Mod, Opts2]),
	% compile file to .beam for sure. it doesn't load it into VM.
	{ok, _} = case compile:file(Mod, Opts2) of
		{ok, _} = A ->
			A;
		E ->
			io:format("compile error: ~p~n", [E]),
			throw (compilation_error)
	end,

	io:format("Disasembling~n"),
	{beam_file,Mod3,Exports,Versions,Options,Disasm} = case beam_disasm:file(ModName) of
		{error, _, {file_error, _ ,_}} = E2 ->
			io:format("compile error: ~p~n", [E2]),
			throw (file_reading_error);
		A2 ->
			A2
	end,
	io:format("Options: ~p~n", [Options]),

	Mod4 = atom_to_list(Mod3),

% this will fail, becuase Mod can be not be loaded into VM.
%	if
%	is_atom(Mod) ->
%		Info = erlang:get_module_info(Mod),
%		{attributes, Attributes} = lists:keyfind(attributes, 1, Info),
%		io:format("Attributes: ~p~n", [Attributes]);
%	true -> true
%	end,

	io:format("Code generation~n"),
	FileName = "erljs_code/"++Mod4++".beam.js",
	{ok, File} = file:open(FileName, [write]),
	ok = file:write(File, ["// ", ?HEAD, 10]),
	ok = file:write(File, ["var module_"++Mod4++ " = [",10]),
	{NumerOfFunction,NumberOfFunsAndLCFuns,NumberOfOps} = lists:foldl(
			fun(F, {Count,CountFuns,CountOps}) ->
				%F2 = cf(F),
				%F2
				%io:format("~s~n~n", [term:encode(F)]),
				%io:format("~s,~n~n", [json_simple:encode(F)]),
				Ops = length(element(5,F)),
				IsFun = case hd(atom_to_list(element(2,F))) of
					$- -> 1;
					_ -> 0
				end,
				if Verbose ->
					io:format("Function: ~s Ops: ~p~n", [atom_to_list(element(2,F)), Ops]);
				true -> ok
				end,
				ok = if
					Count > 0 -> file:write(File, [$,, 10]);
					true -> ok
				end,
				ok = file:write(File, json_simple:encode(F)),
				{Count+1,CountFuns+IsFun,CountOps+Ops}
			end,
			{0,0,0},
		Disasm),
	ok = file:write(File, [10, "];", 10,10]),
	ok = file:close(File),
	%io:format("~10000P~n", [A, 1000]).
	%io:format("~p~n", [A])
	{ok,FileName,[{functions,NumerOfFunction},{funs,NumberOfFunsAndLCFuns},{total_ops,NumberOfOps}]}.

%% Encode function
cf({function, Name, Arity, _, Body} = _F) ->
	lists:reverse(cf(Body, [])).

cf([], C) ->
	C;
cf([I|T], C) ->
	cf(T, [cfi(I)] ++ C).

%% Encode single argument
encode_what({atom, X}) when is_atom(X) ->
	["a",atom_to_list(X)];
encode_what({literal, X}) ->
	["`",[]];
encode_what({x, X}) when is_integer(X) ->
	["r",integer_to_list(X)];
encode_what(_) ->
	["??"].

%% Encode single instruction
cfi({label,N}) when is_integer(N) ->
	["l", N];
cfi({test,Kind,What1,What2}) ->
	["?", Kind, What1, What2];
cfi({case_end,What}) ->
	["}", What];
cfi({get_tuple_element,What1,Which,Where}) ->
	["<", encode_what(What1),Which,encode_what(Where)];
cfi({move,What,{x,RegNo} = Dest}) when is_integer(RegNo) ->
	["m", encode_what(What), RegNo];
cfi({func_info,{atom,Module},{atom,Name},Arrity}) when is_atom(Module), is_atom(Name), is_integer(Arrity) ->
	["f", atom_to_list(Module), atom_to_list(Name), Arrity];
cfi({test_heap,_,_}) ->
	[];
cfi({put_list,What1,What0,Where}) ->
	["L", encode_what(Where), encode_what(What1), encode_what(What0)];
cfi(return) ->
	["R"];
cfi({put_tuple,Size,{x,RegNo}}) ->
	["p", integer_to_list(Size), integer_to_list(RegNo)];
cfi({put,What}) ->
	["P", encode_what(What)];
cfi({call,_,{Mod,Func,Arrity}}) ->
	["c", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_only,_,{Mod,Func,Arrity}}) ->
	["t", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_ext,_,{extfunc,Mod,Func,Arrity}}) ->
	["C", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_ext_only,_,{extfunc,Mod,Func,Arrity}}) ->
	["T", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({deallocate,_RefNo}) ->
	[];
cfi({allocate,_RefNo,_How}) ->
	[];
cfi({gc_bif,Op,{f,0},_,[What1, What2],{x,RegNo}}) -> % Op == '+' '*'
	[atom_to_list(Op), RegNo, encode_what(What1), encode_what(What1)].

%eval_start(A) ->
%	{ok, Pid} = spawn(eval_prepare(A)),
%	{ok, Pid}.
%
%reg(Regs, N) ->
%	ets:lookup_element(Regs, N, 2).
%
%eval_prepare(Code) when is_atom(Module), is_module(Function), is_list(Args) ->
%	R = ets:new(erlsj_regs, [set, private, {keypos, 1}]),
%	C = ets:new(erlsj_code, [set, private, {keypos, 1}]),
%	[ ets:insert(R, {N, undefined}) || N <- lists:seq(0, 128) ],
%	[ ets:insert(C, {ModuleName, FunctionName, FunctionN, Line}) || Function <- Functions ],
%	{R,C,S}.
%
%go({R,C,S}, Module, Function, Args)
%	eval_loop(C, {0}, Tid, []).
%
%eval_loop(Code, {Module, Function, Label, IP}, Tid, Stack) ->
%	ok.
