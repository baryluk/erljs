-module(erljs_compiler).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-export([
	cl/1, cl/2, % compile given list of module
	c/1, c/2 % compile one module
]).

-define(HEAD, ["erljs, auto-generated at ",io_lib:format("~p",[erlang:localtime()]),", Witold Baryluk, 2010"]).

-define(HEADER, ok = file:write(File, ?HEAD)).

-define(CRLF, $\n).
-define(TAB, $\t).


-spec cl([atom() | string()]) ->
	[{'ok', atom(), nonempty_string(), [{'functions', number()} | {'funs',number()} | {'total_ops',number()}, ...]}].

cl(L) ->
	cl(L, []).

-spec cl([atom() | string()], [atom() | {atom(), _} | {'d', atom(), _}]) ->
	[{'ok', atom(), nonempty_string(), [{'functions', number()} | {'funs',number()} | {'total_ops',number()}, ...]}].

cl(L, Opts) ->
	L2 = [ c(M, Opts) || M <- L ],

	io:format("// ~s~n", [lists:flatten(?HEAD)]),
	io:format("var all_modules = [~n"),
	[ io:format("  [\"~s\", module_~s],~n", [M, M]) || {ok, M, F, Stats} <- L2 ],
	io:format("];~n~n"),

	io:format("<!-- ~s -->~n", [lists:flatten(?HEAD)]),
	[ io:format(" <script src=\"~s\" type=\"text/javascript\"> </script>~n", [F]) || {ok, M, F, Stats} <- L2 ],
	io:format(" <script src=\"erljs_code.js\" type=\"text/javascript\"> </script>~n"),
	L2.

-spec c(atom() | string()) ->
	{'ok', atom(), nonempty_string(), [{'functions', number()} | {'funs',number()} | {'total_ops',number()}, ...]}.

c(Mod) ->
	c(Mod, []).

-spec c(atom() | string(), [atom() | {atom(), _} | {'d', atom(), _}]) ->
	{'ok', atom(), nonempty_string(), [{'functions', number()} | {'funs',number()} | {'total_ops',number()}, ...]}.

%% Encode module
c(Mod, Opts) when is_list(Mod) ->
	case lists:suffix(".beam", Mod) of
		true -> c2(Mod, Opts);
		false -> c1(Mod, Opts)
	end;
c(Mod, Opts) when is_atom(Mod) ->
	c1(Mod, Opts).


%% Encode module
c1(Mod, Opts) ->
	ModName0 = if
		is_atom(Mod) -> atom_to_list(Mod);
		is_list(Mod) -> Mod
	end,

	%case filename:extension(ModName0) of
	%	".rel" -> filename:rootname(ModName0) ++ ".beam";
	%	[] ->
	%end;

	ModName = case lists:reverse(ModName0) of
		"lre." ++ R -> lists:reverse(R, ".beam");
		_ -> ModName0
	end,

	% filename:find_src(Beam)
	% filename:find_src(Beam, Rules)
%3> filename:find_src(kernel).
%{"/usr/lib/erlang/lib/kernel-2.14.5/src/kernel",
% [{i,"/tmp/buildd/erlang-14.b.4-dfsg/lib/kernel/src/../include"},
%  {outdir,"/tmp/buildd/erlang-14.b.4-dfsg/lib/kernel/src/../ebin"}]}


	% 'S' - will prdue File.S with assembler code.
	%Opts2 = Opts ++ [debug_info,report,inline,{inline_size,24},warn_obsolete_guard],
	Dirname = filename:dirname(ModName),
	Opts2 = Opts ++ [debug_info,report,warn_obsolete_guard] ++ [{outdir, Dirname}],
	io:format("Recompiling: ~p with options~n  ~p~n", [Mod, Opts2]),
	% compile file to .beam for sure. it doesn't load it into VM.
	%{ok, ModuleName, Binary} = case compile:file(Mod, [binary | Opts2]) of
	{ok, _} = case compile:file(Mod, Opts2) of
		{ok, _} = A ->
			io:format("Compilation sucessfull: ~p~n", [A]),
			A;
		E ->
			io:format("Compilation error: ~p~n", [E]),
			throw (compilation_error)
	end,

	c2(Mod, ModName, Opts).

c2(_Mod, ModName, Opts) ->
	c2(ModName, Opts).

c2(ModName, Opts) ->
	Verbose = lists:member(verbose, Opts),
	Indent = lists:member(indent, Opts),

	io:format("Disasembling file ~p~n", [ModName]),
	% We can pass binary() directly to beam_disasm:file/1 !
	{beam_file,Mod3,_Exports,_Versions,Options,Disasm} = case beam_disasm:file(ModName) of
		{error, _, {file_error, _ ,_}} = E2 ->
			io:format("Decompilation error: ~p~n", [E2]),
			throw (file_reading_error);
		A2 ->
			A2
	end,
	io:format("Options: ~p~n", [Options]),

	_Mod = Mod3,

	Mod4 = atom_to_list(Mod3),

% this will fail, becuase Mod can be not be loaded into VM.
%	if
%	is_atom(Mod) ->
%		Info = erlang:get_module_info(Mod),
%		{attributes, Attributes} = lists:keyfind(attributes, 1, Info),
%		io:format("Attributes: ~p~n", [Attributes]);
%	true -> true
%	end,

	FileName = "erljs_code/"++Mod4++".beam.js",
	io:format("Code generation to ~p~n", [FileName]),
	{ok, File} = file:open(FileName, [write]),
	ok = file:write(File, ["// ", ?HEAD, ?CRLF]),
	ok = file:write(File, ["var module_"++Mod4++ " = [", ?CRLF]),
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
					Count > 0 -> file:write(File, [$,, ?CRLF]);
					true -> ok
				end,
				%io:format("Function: ~p~n", [F]),
				case F of
					{function,FunctionName,FunctionArity,FunctionEntryPoint,Instructions} when is_list(Instructions) ->
						ok = file:write(File, "[\"function\",\""++atom_to_list(FunctionName)++"\","++integer_to_list(FunctionArity)
												++","++integer_to_list(FunctionEntryPoint)++",["++[?CRLF]),
						%ok = file:write(File, [?CRLF, ?TAB]),
						lists:foldl(fun (Inst, Number) ->
							InstFiltered = case Inst of
								% not needed
								{allocate,_,_} -> [];
								{allocate_zero,_,_} -> [];
								{allocate_heap,_,_,_} -> [];
								{allocate_heap_zero,_,_,_} -> [];
								{deallocate,_} -> [];
								{test_heap,_,_} -> [];

								% fix literals encoding
								{move, {literal, X}, RR} ->
									{m, {literal, lists:flatten(io_lib:write(X))}, RR};
								{put, {literal, X}} ->
									{'P', {literal, lists:flatten(io_lib:write(X))}};
								{test, T1, T2, [T3, {literal, X}]} ->
									{t, T1, T2, [T3, {literal, lists:flatten(io_lib:write(X))}]};
								{put_list, T1, {literal, X}, T3} ->
									{p, T1, {literal, lists:flatten(io_lib:write(X))}, T3};

								% shorter opcodes for common things:
								{call_only, T1, T2} ->
									{c, T1, T2};
								{call, T1, T2} ->
									{'C', T1, T2};
								{label, L} ->
									{l, L};
								return ->
									r;

								{move, T1, T2} ->
									{m, T1, T2};
								{test, T1, T2, T3} ->
									{t, T1, T2, T3};
								{gc_bif, T1, T2, T3, T4, T5} ->
									{'G', T1, T2, T3, T4, T5};

								{get_list, T1, T2, T3} ->
									{g, T1, T2, T3};
								{put_list, T1, T2, T3} ->
									{p, T1, T2, T3};

								{put, T1} ->
									{'P', T1};

								send ->
									'!';


								% warning letters used above are not the same as bellow!!

								_ ->
									Inst
							end,
							case InstFiltered of
								[] ->
									Number;
								_ ->
									TextEncoded = json_simple:encode(InstFiltered),
									ok = if
										Number > 1 ->
											file:write(File, [$,]),
											ok = if Indent -> file:write(File, [?CRLF]); true -> ok end;
										true -> ok
									end,
									ok = if Indent -> file:write(File, [?TAB]); true -> ok end,
									file:write(File, TextEncoded),
									Number+1
							end
						end, 1, Instructions),
						ok = file:write(File, "]]")
				end,
				%ok = file:write(File, json_simple:encode(F)),
				%file:write(File, io_lib:print(F,4,132,-1)),
				%ok=file:write(File, io_lib:write(F)),
				%ok=file:write(File, io_lib:write(lists:flatten(cf(F)))),
				{Count+1,CountFuns+IsFun,CountOps+Ops}
			end,
			{0,0,0},
		Disasm),
	ok = file:write(File, [?CRLF, "];", ?CRLF, ?CRLF]),
	ok = file:close(File),
	%io:format("~10000P~n", [A, 1000]).
	%io:format("~p~n", [A])
	io:format("~n"),
	Stats = [
		{functions,NumerOfFunction},
		{funs,NumberOfFunsAndLCFuns},
		{total_ops,NumberOfOps}
	],
	{ok, Mod3, FileName, Stats}.

%% return r, call_ c_, atom a, integer i, label l, test t, move m, put_list P, get_list G, put_tuple T, put p, get_tuple_element g
%% case_end }
%% usunac: allocate*, deallocate*, test_heap

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
	["`",io_lib:write(X)];
encode_what({x, X}) when is_integer(X) ->
	["x",integer_to_list(X)];
encode_what({y, X}) when is_integer(X) ->
	["y",integer_to_list(X)];
encode_what({integer, X}) when is_integer(X) ->
	["i",integer_to_list(X)];
encode_what({float, X}) when is_float(X) ->
	["~",float_to_list(X)];
encode_what(nil) ->
	".".

%% Encode single instruction
cfi({label,N}) when is_integer(N) ->
	["l", N];
cfi({test,Kind,What1,What2}) ->
	["?", Kind, What1, What2];
cfi({case_end,What}) ->
	["}", What];
cfi({badmatch,What}) ->
	["e", What];
cfi(if_end) ->
	[")"];
cfi({move,What,{Type,RegNo} = Dest}) when is_integer(RegNo) ->
	["m", encode_what(What), Type, RegNo];
cfi({func_info,{atom,Module},{atom,Name},Arrity}) when is_atom(Module), is_atom(Name), is_integer(Arrity) ->
	["f", atom_to_list(Module), atom_to_list(Name), Arrity];
cfi({put_list,What1,What0,Where}) ->
	["L", encode_what(Where), encode_what(What1), encode_what(What0)];
cfi(return) ->
	["R"];
cfi({put_tuple,Size,{x,RegNo}}) ->
	["p", integer_to_list(Size), integer_to_list(RegNo)];
cfi({put,What}) ->
	["P", encode_what(What)];
cfi({get_tuple_element,What1,Which,Where}) ->
	["<", encode_what(What1),Which,encode_what(Where)];
cfi({set_tuple_element,What1,Where,Which}) -> % ?
	[">", encode_what(What1),encode_what(Where),Which];
cfi({call,_,{Mod,Func,Arrity}}) ->
	["c", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_only,_,{Mod,Func,Arrity}}) ->
	["t", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_last,_,{Mod,Func,Arrity}, _Something}) ->
	["t", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_ext,_,{extfunc,Mod,Func,Arrity}}) ->
	["C", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_ext_only,_,{extfunc,Mod,Func,Arrity}}) ->
	["T", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({call_ext_last,_,{extfunc,Mod,Func,Arrity},_Something}) ->
	["T", 2, atom_to_list(Mod), atom_to_list(Func), integer_to_list(Arrity)];
cfi({apply_last,N,B}) ->
	["A"];
cfi({apply,N}) ->
	["a"];
cfi({gc_bif,Op,{f,F},_,[What1, What2],{R,RegNo}}) -> % Op == '+' '*'    _=2, but also 4?
	[atom_to_list(Op), R, RegNo, encode_what(What1), encode_what(What1)];
cfi({gc_bif,Op,{f,F},_,[What1],{x,RegNo}}) -> % Op == length, '-',  _=1,2,...?
	[atom_to_list(Op), RegNo, encode_what(What1)];
cfi({bif, Op,{f,F},[What1,What2],{x,RegNo}}) when Op=:='=:='; Op=:='=='; Op=:='geaaaa'; Op=:='element'; Op=:='>'; Op=:='<'; Op=:='and'; Op=:='>=' ->
	[atom_to_list(Op), RegNo, encode_what(What1), encode_what(What2)];
cfi({bif, Op,{f,F},[What1],{x,RegNo}}) when Op=:='get'; Op=:='tuple_size'; Op=:='not'; Op=:='tl'; Op=:='hd' ->
	[atom_to_list(Op), RegNo, encode_what(What1)];
cfi({get_list,{X1,R1},{X2,R2},{X3,R3}}) ->
	["g"];
cfi({select_val,{x,R1},{f,F},{list, L}}) ->
	["S"];
cfi({select_tuple_arity,{x,R1},{f,F},{list, L}}) ->
	["Y"];
cfi({make_fun2, {M,F,A},Id,Uniq,_Something}) ->
	["make_fun",M,F,A];
cfi({call_fun, N}) ->
	["*",N];
cfi({test_heap,_,_}) ->
	[];
cfi({fconv,S,D}) ->
	[];
cfi({fmove,S,D}) ->
	[];
cfi(fclearerror) ->
	[];
cfi({fcheckerror,F}) ->
	[];
cfi({arithfbif,Op,F,Args,{fr,R}}) ->
	[];
cfi({jump,F}) ->
	[];
cfi({allocate,_RefNo,_How}) ->
	[];
cfi({allocate_heap,_,_,_}) ->
	[];
cfi({allocate_zero,_,_}) ->
	[];
cfi({allocate_heap_zero,_,_,_}) ->
	[];
cfi({deallocate,_RefNo}) ->
	[];
cfi({init, What1}) ->
	[];
cfi({'try',Register,FLabel}) -> % probably only {y,R}
	[];
cfi({try_end,Register}) ->
	[];
cfi({try_case,Register}) ->
	[];
cfi({try_case_end,Register}) -> % this could be {x,R}
	[];
cfi({raise,F,[What1,What2],{x,RegNo}}) ->
	[];
cfi({trim, A,B}) ->
	["trim",A,B];
cfi({loop_rec, F,R}) ->
	[];
cfi(remove_message) ->
	[];
cfi({loop_rec_end, F}) ->
	[];
cfi({wait_timeout,F,What1}) ->
	[];
cfi(timeout) ->
	[].
