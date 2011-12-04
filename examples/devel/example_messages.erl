-module(example_messages).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-compile([export_all]).
-export_js([export_all]).

% Messages - sending

m1(P, X) ->
	P ! X.

m1(X) ->
	dupa ! X.

% Messages - receive

