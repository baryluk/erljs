-module(example_messages).

-compile([export_all]).
-export_js([export_all]).

% Messages - sending

m1(P, X) ->
	P ! X.

m1(X) ->
	dupa ! X.

% Messages - receive

