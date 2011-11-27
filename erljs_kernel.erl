-module(erljs_kernel).

-export([start/1]).

start(Args) ->
	P3 = genser_test2:start({przycisk_pi_start1, pole_pi1}),
	P2 = genser_test2:start({przycisk_pi_start2, pole_pi2}),
	P1 = genser_test:start(),
	ok.
