-module(erljs_kernel).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-export([start/1]).

start(Args) ->
	P3 = genser_test2:start({przycisk_pi_start1, pole_pi1}),
	P2 = genser_test2:start({przycisk_pi_start2, pole_pi2}),
	P1 = genser_test:start(),
	ok.
