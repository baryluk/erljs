-module(erljs_beam_vm).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

%-export([eval_start/1, eval_prepare/1, go/4]).


% This was try to implement erlang beam bytecode intepreter in erlang. :)
%
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

