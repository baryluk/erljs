-module(genser_calculatepi).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-behaviour(gen_server).

-export([start/1, start_link/1]).
-export([init/1, handle_info/2, terminate/2, code_change/3]).

-export([calculate_pi/3]).

% starting api

start(Args = {Przycisk, Pole}) ->
    gen_server:start({local, Pole}, ?MODULE, Args, []).
start_link(Args = {Przycisk, Pole}) ->
    gen_server:start_link({local, Pole}, ?MODULE, Args, []).

% gen_server interface

init({Przycisk, Pole}) ->
	{ok, _} = erljs:listen(Przycisk, click, [], {start}),
	erljs:set(Pole, value, {initialized, ?MODULE, Przycisk, Pole, self()}),
	{ok, {Pole, 0.0, 1}}.



calculate_pi(Pass, Pole, N) ->
	4.0*calculate_pi(Pass, Pole, 0.0, 1.0, 1, 2*N+1, 0).

calculate_pi(Pass, Pole, X, S, I, N, 789) ->
	erljs:set(Pole, value, {partial, Pass, I, 4.0*X}),
	calculate_pi(Pass, Pole, X, S, I, N, 0);
calculate_pi(Pass, _Pole, X, _S, I, I, _) ->
	X;
calculate_pi(Pass, Pole, X, S, I, N, K) ->
	calculate_pi(Pass, Pole, X + S/I, -S, I+2, N, K+1).



handle_info({dom, _Id, _Ref, _Type, _Value, {start}} = _E, State = {Pole, _, Pass}) ->
	%N = erljs:set(pole_pi_in, value),
	erljs:set(Pole, value, "Calculation started..."),
	S = calculate_pi(Pass, Pole, 100000),
	erljs:set(Pole, value, {done, Pass, S}),
	{noreply, {Pole, S, Pass+1}};
handle_info(M, State = {Pole, _, _Pass}) ->
	erljs:set(Pole, value, {unknown_msg, M}),
	{noreply, State}.

terminate(normal, _State) ->
	ok.

code_change(_OldVersion, State, _Extra) -> {ok, State}.

