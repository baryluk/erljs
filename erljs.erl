-module(erljs).

-compile([export_all]).

c(Mod) ->
	c(Mod, []).

%% Encode module
c(Mod, Opts) ->
	ModName = if
		is_atom(Mod) -> atom_to_list(Mod);
		is_list(Mod) -> Mod
	end,

	% compile file to .beam for sure. it doesn't load it into VM.
	{ok, _} = compile:file(Mod, Opts),

	{beam_file,Mod3,Exports,Versions,Options,Disasm} = beam_disasm:file(ModName),
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

	{ok, File} = file:open("erljs_code/"++Mod4++".beam.js", [write]),
	ok = file:write(File, ["//erljs, auto-generated at ",io_lib:format("~p",[erlang:localtime()]),", Witold Baryluk, 2010", 10]),
	ok = file:write(File, ["var module_"++Mod4++ " = [",10]),
	{NumerOfFunction} = lists:foldl(
			fun(F, {Count}) ->
				%F2 = cf(F),
				%F2
				%io:format("~s~n~n", [term:encode(F)]),
				%io:format("~s,~n~n", [json_simple:encode(F)]),
				ok = file:write(File, [json_simple:encode(F), $,, 10]),
				{Count+1}
			end,
			{0},
		Disasm),
	ok = file:write(File, ["];", 10,10]),
	ok = file:close(File),
	%io:format("~10000P~n", [A, 1000]).
	%io:format("~p~n", [A])
	{ok,NumerOfFunction}.

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
