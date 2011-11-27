-module(example_binaries).

-compile([export_all]).
-export_js([export_all]).

% Binaries - contstruct

bin1(X) ->
	<<"ala">>.

bin2(X) ->
	<<97,99,101>>.

bin3a(X) ->
	<<99,97,X,104>>.

bin3b(X) ->
	<<99,97,X:16,104>>.

bin3c(X) ->
	<<99,97,X:24,104>>.

bin3d(X) ->
	<<99,97,X:32,104>>.

bin3f(X) ->
	<<99,97,X:32/float,104>>.

bin4(X) ->
	15 = byte_size(X),
	ok.

bin4b(X) when byte_size(X) =:= 15 ->
	ok.

bin5(X) ->
	15 = size(X),
	ok.

bin5b(X) when size(X) =:= 15 ->
	ok.

bin6(X) ->
	15 = bit_size(X),
	ok.

bin6b(X) when bit_size(X) =:= 15 ->
	ok.


bin7a(X,Y) ->
	<<X:16,Y/binary>>.

bin7b(X,Y) ->
	<<X/binary,Y/binary>>.

bin7c(X,Y) ->
	<<X/binary,Y:16>>.

bin8(X,Y) ->
	<<X:25,Y:9>>.


bin9(X,Y) ->
	<<99,97,X:Y,104>>.

% Binaries - matching

unbin1(X) ->
	<<A>> = X,
	{A}.

unbin2(X) ->
	<<A,_Rest/binary>> = X,
	{A}.

unbin3(X) ->
	<<A:32/float,_Rest/binary>> = X,
	{A}.

unbin4(X) ->
	<<A:64/binary,_Rest/binary>> = X,
	{A}.
