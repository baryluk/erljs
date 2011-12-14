-module(gensup_test).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-behaviour(supervisor).

-export([start_link/0]).
-export([init/1]).

start_link() ->
	supervisor:start_link(ch_sup, []).

init(_Args) ->
	{ok, {{one_for_one, 1, 60}, [
		{genser_test, {genser_test, start_link, []},
			permanent, brutal_kill, worker, [genser_test]},
		{genser_test2, {genser_test2, start_link, [{przycisk_pi_start1, pole_pi1}]},
			permanent, brutal_kill, worker, [genser_test2]},
		{genser_test2, {genser_test2, start_link, [{przycisk_pi_start2, pole_pi2}]},
			permanent, brutal_kill, worker, [genser_test2]}
	]}}.
