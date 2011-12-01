-module(random_term).

-export([
	any_term/1,
	any/1
]).

any(Seed) ->
	{_, X} = any_term(Seed),
	X.

next_seed(Seed) ->
	random:uniform_s(10000000,Seed).

any_term(Seed) ->
	{X, Seed2} = next_seed(Seed),
	any_term(X, Seed2).

any_term(X, Seed) when (0 =< X), X =< 10 ->
	atom_term(Seed);
any_term(X, Seed) when (11 =< X), X =< 20 ->
	integer_term(Seed);
any_term(X, Seed) when (21 =< X), X =< 30 ->
	float_term(Seed);
any_term(X, Seed) when (31 =< X), X =< 40 ->
	nil_term(Seed);
any_term(X, Seed) when (41 =< X), X =< 50 ->
	stringlist_term(Seed);
any_term(X, Seed) when (51 =< X), X =< 52 ->
	binary_term(Seed);
any_term(X, Seed) when (53 =< X), X =< 54 ->
	ref_term(Seed);
any_term(X, Seed) when (55 =< X), X =< 56 ->
	pid_term(Seed);
any_term(X, Seed) when (57 =< X), X =< 58 ->
	port_term(Seed);

any_term(X, Seed) when (59 =< X), X =< 67 ->
	tuple_term(Seed);

any_term(X, Seed) when (68 =< X), X =< 70 ->
	anylist_term(Seed);
any_term(X, Seed) when (71 =< X), X =< 75 ->
	nonemptylist_term(Seed);
any_term(X, Seed) when (76 =< X), X =< 78 ->
	improperlist_term(Seed);
any_term(X, Seed) when (79 =< X), X =< 81 ->
	properlist_term(Seed);

any_term(X, Seed) when X >= 82 ->
	any_term(X rem 82, Seed).

atom_term(Seed1) ->
	{X, Seed2} = next_seed(Seed1),
	{Seed3, A} = lists:foldl(
		fun (_I, {S, L}) ->
			{H, S2} = next_seed(S),
			H2 = 20 + (H rem 100),
			{S2, [H2|L]}
		end,
		{Seed2, []},
		lists:seq(1, X rem 5)
	),
	{Seed3, list_to_atom(A)}.

tuple_term(Seed1) ->
	{X, Seed2} = next_seed(Seed1),
	{Seed3, T} = lists:foldl(
		fun (_I, {S, L}) ->
			{S2, H} = any_term(S),
			{S2, [H|L]}
		end,
		{Seed2, []},
		lists:seq(1, X rem 12)
	),
	{Seed3, list_to_tuple(T)}.

properlist_term(Seed1) ->
	{X, Seed2} = next_seed(Seed1),
	{Seed3, T} = lists:foldl(
		fun (_I, {S, L}) ->
			{S2, H} = any_term(S),
			{S2, [H|L]}
		end,
		{Seed2, []},
		lists:seq(1, X rem 12)
	),
	{Seed3, T}.


integer_term(Seed1) ->
	{X, Seed2} = next_seed(Seed1),
	{Seed2, (X rem 200) - 100}.

float_term(Seed) ->
	{X, Seed2} = next_seed(Seed),
	{Seed2, (X rem 20000)/317.332 - 200}.

nil_term(Seed) ->
	{Seed, []}.

anylist_term(Seed1) ->
	{Seed2, H} = {Seed1, a}, %any_term(Seed1),
	{Seed3, T} = {Seed2, H}, %any_term(Seed2),
	{Seed3, [H|T]}.

nonemptylist_term(Seed1) ->
	{Seed2, L} = properlist_term(Seed1),
	{Seed3, H} = any_term(Seed2),
	{Seed3, [H|L]}.

improperlist_term(Seed) ->
	{Seed, [a,b|c]}.

stringlist_term(Seed1) ->
	{X, Seed2} = next_seed(Seed1),
	{Seed3, A} = lists:foldl(
		fun (_I, {S, L}) ->
			{H, S2} = next_seed(S),
			H2 = 32 + (H rem 94),
			{S2, [H2|L]}
		end,
		{Seed2, []},
		lists:seq(1, X rem 5)
	),
	{Seed3, A}.

binary_term(Seed) ->
	{Seed, {b,[i,n|a]}}.

ref_term(Seed) ->
	{Seed, {r,[],f}}.

pid_term(Seed) ->
	{Seed, {p,i}}.

port_term(Seed) ->
	{Seed, {p}}.


