-module(epe).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project


-export([f/1]).

f(N) ->
	{ok, S} = f([],N,0),
	{ok, S div N}.

f(_,0,S) ->
	{ok,S};
f(T,N,S) ->
	T2 = erlang:list_to_tuple(['\000'|T]),
	T3 = erlang:list_to_tuple(['\001'|T]),
	T4 = erlang:list_to_tuple(['\002'|T]),
	T5 = erlang:list_to_tuple(['\003'|T]),
	H2 = erlang:phash(T2, 1 bsl 32),
	H3 = erlang:phash(T3, 1 bsl 32),
	H4 = erlang:phash(T4, 1 bsl 32),
	H5 = erlang:phash(T5, 1 bsl 32),
	S2 = S + H3-H2,
	%io:format("~p~n", [H3-H2]),
	f(['\000'|T],N-1,S2).

