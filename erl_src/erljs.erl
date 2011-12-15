-module(erljs).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-compile([export_all]).

% TODO: ponizej zakomentowano wiele -spec bo kompilator krzyczy w nower werji

%-spec eval(io_list()) -> {ok, term()} | {error, term()}.
eval(X) ->
	%throw (callable_only_at_client_side).
	ignored.

-spec alert(any()) -> ok | {error, term()}.
alert(X) ->
	%throw (callable_only_at_client_side).
	ignored.

-spec confirm(any()) -> ok | cancel | {error, term()}.
confirm(X) ->
	%throw (callable_only_at_client_side).
	ignored.

-spec monit(any()) -> {ok, term()} | {cancel, term()} | {error, term()}.
monit(X) ->
	%throw (callable_only_at_client_side).
	ignored.

-spec console_log(any()) -> ok | {error, term()}.
console_log(X) ->
	ignored.
