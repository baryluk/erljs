%%% Copyright (c) 2005-2006, A2Z Development USA, Inc.  All Rights Reserved.
%%%
%%% The contents of this file are subject to the Erlang Public License,
%%% Version 1.1, (the "License"); you may not use this file except in
%%% compliance with the License. You should have received a copy of the
%%% Erlang Public License along with this software. If not, it can be
%%% retrieved via the world wide web at http://www.erlang.org/.
%%% 
%%% Software distributed under the License is distributed on an "AS IS"
%%% basis, WITHOUT WARRANTY OF ANY KIND, either express or implied. See
%%% the License for the specific language governing rights and limitations
%%% under the License.
%%% 
%%% The Initial Developer of the Original Code is A2Z Development USA, Inc.
%%% All Rights Reserved.

-module(json_simple).
-export([encode/1]).
%-export([is_obj/1, obj_new/0, obj_fetch/2, obj_find/2, obj_is_key/2]).
%-export([obj_store/3, obj_from_list/1, obj_fold/3]).
%-export([test/0]).
-author("Jim Larson <jalarson@amazon.com>, Robert Wai-Chi Chu <robchu@amazon.com>").
-vsn("1").

%%% ENCODING

%% Encode an erlang number, string, tuple, or object to JSON syntax, as a
%% possibly deep list of UTF-16 code units, throwing a runtime error in the
%% case of un-convertible input.
%% Note: object keys may be either strings or atoms.

-spec encode(atom() | [any()] | number() | tuple()) -> [any()].

%encode(true) -> "true";
%encode(false) -> "false";
%encode(null) -> "null";
encode(I) when is_integer(I) -> integer_to_list(I);
encode(F) when is_float(F) -> io_lib:format("~w", [F]);
encode([]) -> encode_string([]);
encode([C|_] = L) when is_integer(C), C >= $\000, C =< $\377  ->
	try encode_string(L) of R ->
		R
	catch exit:_ ->
		encode_list(L)
	end;
encode(L) when is_list(L) -> encode_list(L);
encode({}) -> "[]";
encode(T) when is_tuple(T) -> encode_array(T);
encode(A) when is_atom(A) -> encode(atom_to_list(A));
encode(Bad) -> exit({json_encode, {bad_term, Bad}}).

% todo: encode directly to IoDecive

%% Encode an Erlang string to JSON.
%% Accumulate strings in reverse.

-spec encode_string([any()]) -> [any(), ...].

encode_string(S) -> encode_string(S, [$"]).

-spec encode_string([any()], [any(), ...]) -> [any(), ...].

encode_string([], Acc) -> lists:reverse([$" | Acc]);
encode_string([C | Cs], Acc) ->
    case C of
	$" -> encode_string(Cs, [$", $\\ | Acc]);
	% (don't escape solidus on encode)
	$\\ -> encode_string(Cs, [$\\, $\\ | Acc]);
	$\b -> encode_string(Cs, [$b, $\\ | Acc]);	% note missing \
	$\f -> encode_string(Cs, [$f, $\\ | Acc]);
	$\n -> encode_string(Cs, [$n, $\\ | Acc]);
	$\r -> encode_string(Cs, [$r, $\\ | Acc]);
	$\t -> encode_string(Cs, [$t, $\\ | Acc]);
        C when C >= 0, C < $\s ->
            % Control characters must be unicode-encoded.
            Hex = lists:flatten(io_lib:format("~4.16.0b", [C])),
            encode_string(Cs, lists:reverse(Hex) ++ "u\\" ++ Acc);
        C when C =< 16#FFFF -> encode_string(Cs, [C | Acc]);
        _ -> exit({json_encode, {bad_char, C}})
    end.


%% Encode an Erlang tuple as a JSON array.
%% Order *is* significant in a JSON array!

-spec encode_array(tuple()) -> [[any()] | 91 | 93, ...].

encode_array(T) ->
    M = tuple_fold(fun(E, Acc) ->
	V = encode(E),
	case Acc of
	    [] -> V;
	    _ -> [Acc, $,, V]
	end
    end, [], T),
    [$[, M, $]].

-spec encode_list([any()]) -> [[any()] | 91 | 93,...].

encode_list(T) ->
    M = lists:foldl(fun(E, Acc) ->
	V = encode(E),
	case Acc of
	    [] -> V;
	    _ -> [Acc, $,, V]
	end
    end, [], T),
    [$[, M, $]].

%% A fold function for tuples (left-to-right).
%% Folded function takes arguments (Element, Accumulator).

-spec tuple_fold(fun((_,_) -> [any()]), [], tuple()) -> [any()].

tuple_fold(F, A, T) when is_tuple(T) ->
    tuple_fold(F, A, T, 1, size(T)).

-spec tuple_fold(fun((_,_) -> [any()]), [any()], tuple(), pos_integer(), non_neg_integer()) -> [any()].

tuple_fold(_F, A, _T, I, N) when I > N ->
    A;
tuple_fold(F, A, T, I, N) ->
    A2 = F(element(I, T), A),
    tuple_fold(F, A2, T, I + 1, N).
