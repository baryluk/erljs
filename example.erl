-module(example).

-compile([export_all]).

-export([sum1/1, sum2/2,
	diff2/2, iloraz2/2,
	ntka/2,
	tailowa/1, nietailowa/1,
	fqdn/1,
	konwencje1/3, konwencje2/3, konwencje3/3, konwencje4/3,
	listy/0, listy2/1,
	a/1,
	mnozacz/1,
	fl/1,
	kase/1,
	duzyterm/0
	]).

-export_js([export_all]).

sum1(X) ->
	2*X.

sum2(X,Y) ->
	2+Y+X.

diff2(X,Y) ->
	2-X-Y.

iloraz2(X,Y) ->
	20/X/Y.

ntka(X,Y) ->
	{1,Y,5, X}.

tailowa(X) ->
	ntka(X, 100).

nietailowa(X) ->
	A=ntka(X, 100),
	{3233, A}.

notfqdn(X) ->
	notfqdn(X).

fqdn(X) ->
	example:fqdn(X).

konwencje1(A,B,C) ->
	{A,B,C}.

konwencje2(X,Y,Z) ->
	konwencje1(X,Y,Z).

konwencje3(X,Y,Z) ->
	A=konwencje1(a,X,Y),
	{ff, A}.

konwencje4(X,Y,Z) ->
	konwencje1(X,Z,Y).

listy() ->
	[a,b,c].

listy2(A) ->
	[a,A,c].

a(E) ->
	apply(E, lists, [a]).
a(E,X) ->
	apply(E, lists, X).
a0(E) ->
	E:lists(a).

a2(E) ->
	{apply(E, lists, [a])}.
a2(E,X) ->
	{apply(E, lists, X)}.
a20(E,X) ->
	{E:lists(X)}.

af(F) ->
	apply(F, [a,5]).
af(F,X) ->
	apply(F, X).

af0(F) ->
	F().
af1(F) ->
	F(3,5).

% bug this is not tail recurisve. compiler allocate one additional register, need to free
af0_bug(F,X) ->
	F(X).
af1_bug(F,X) ->
	F(3,4,5).



af0_bug_test(F,X) ->
	F(F,X-1).

af0_bug_start(N0) ->
	af0_bug_test(fun(Self, 0) -> ok; (Self, X) -> Self(Self, X-1) end, N0).


af2(F) ->
	{apply(F, [a,5])}.
af2(F,X) ->
	{apply(F, X)}.
af20(F,X) ->
	{F(X)}.

af21(F,X) ->
	{F(3,4,5)}.

matche(A) ->
	case A of
		{B,_} -> ok;
		aaa -> dd
	end.

matche2(A) ->
	case A of
		{B,_,44} -> B;
		aa123a -> dd
	end.

mnozacz(X) ->
	F = fun(Y) -> X*Y end,
	F.

mnozacze(X) ->
	F = fun(Y) -> X*Y end,
	G = fun(Y) -> X+Y end,
	H = fun(Y) -> X-Y end,
	{F,G,H}.


mnozacz2(X) ->
	F = fun mnoznik2/1,
	F.

mnozacz3(X) ->
	F = fun example:mnoznik2/1,
	F.

mnoznik2(Y) ->
	2*Y.

mnozacz_big1(X) ->
	F = fun(Y,Y2,Y3,Y4,Y5,Y6) -> {X*Y,Y2,Y3,Y4,Y5,Y6} end,
	{F,zzzzzzz}.

mnozacz_big2(X,Y2,Y3,Y4,Y5,Y6) ->
	F = fun(Y) -> {X*Y,Y2,Y3,Y4,Y5,Y6} end,
	{F,zzzzzzz}.

mnozacz_big3(Y2,Y3,Y4,Y5,Y6,X) ->
	F = fun(Y) -> {X*Y,Y2,Y3,Y4,Y5,Y6} end,
	{F,zzzzzzz}.

mnozacz_big4(Z,Y2,Y3,Y4,Y5,Y6,X) ->
	F = fun(Y) -> {X*Y,Y2,Y3,Y4,Y5,Y6} end,
	{F,zzzzzzz}.


mnozacz_s1(Y2,Y3,Y4,Y5,Y6) ->
	F = fun(Y,X) -> {X*Y} end,
	{F,zzzzzzz}.


mnozacz_s2() ->
	F = fun(Y,X) -> {X*Y} end,
	{F,zzzzzzz}.


mnozacz_s2(O1,O2,O3) ->
	F = fun(Y,X) -> {X*Y} end,
	{F,zzzzzzz}.

mnozacz_s3(O1,O2,O3) ->
	F = fun(Y,X) -> {X*Y} end,
	{F,zzzzzzz}.

mnozacz_s4(O1,O2,O3) ->
	F = fun(Y,X) -> {X*Y} end,
	{F,zzzzzzz}.


odbierz() ->
	receive
		a -> ok;
		f -> j
		after 1111 -> kkk
	end.

odbierz2(X) ->
	receive
		{a, X, X} -> ok;
		f -> j
		after 1111 -> kkk
	end.

fl(X) ->
	Z=2.0*X + 5.1-55.5/X,
	X/-Z.

kase(X) ->
	case X of
		{a, 1, N} when N >= 33 ->
			{c, N};
		{b, N} when N < 13 ->
			{z, N+44}
	end.

kase2(Y) ->
	case Y of
		N  when N > 13 ->
			z;
		N  when N < 1 ->
			z2;
		N  when N >= 10 ->
			z;
		N  when N =< 4 ->
			z2
	end.


duzyterm() ->
	A={o,p,e,r,a},
	[A,A].

silnia(N) ->
	silnia(N, 1).

silnia(0, Acc) ->
	Acc;
silnia(N, Acc) ->
	silnia(N-1, N*Acc).


sd(N) ->
	N/33.


maly_div(N) ->
	N div 33.


maly_minus(N) ->
	-N.

maly_rem(N) ->
	N rem 33.

maly_bbbbb(N) ->
	bnot (N bor 33) bxor (N band 44).

maly_bbbbb2(L,N) ->
	B=L bsr N,
	B2=L bsl N,
	{B,B2}.

jss(N) ->
	erljs:eval(N).

jss1(N) ->
	erljs:eval("alert(4)").

jss2(N) ->
	erljs:alert(10031*N).

jss3(N) ->
	erljs:alert(N).

hhh(L) ->
	[H|T] = L,
	{hhhhhh,H,mmmmm,T,eeeee}.

hhh3(L) ->
	[H,H2|T] = L,
	{hhhhhh,H,mmmmm,H2,mnnnnn,T,eeeee}.

conc(L1,L2) ->
	L1 ++ L2.

hhh4(L) ->
	[] = L,
	o.

% erlang:* and bifs

zzzz(N) when N > 10 ->
	2*N.

zzzz2(N) when N > 10 ->
	2*N;
zzzz2(N) when N > 5 ->
	2-N.

zzzz3(A,A) ->
	2-A.

zzzz4(6) ->
	2.

zzzz_size1(N) when size(N) == 4 ->
	4.

zzzz_size2(N) ->
	2+size(N).

zzzz_size3(N) ->
	2+erlang:size(N).

zzzz_abs(N) ->
	2+abs(N).


llll(N) ->
	K=[N,N,N,N],
	{ostatni,lists:last(K)}.

llll2(N) ->
	{N,[]}.

llll3(N,T) ->
	L=lists:seq(N, N+1000),
	{lists:nthtail(T, L)}.

llll_z(N) ->
	L1=lists:seq(N, N+1000),
	L2=lists:seq(N+310, N+1310),
	{lists:zip(L1,L2)}.


llll_u(N) ->
	{LZ} = llll_z(N),
	{lists:unzip(LZ)}.

% computes in JS up to fib1(22), then it needs more than 500,000 ops
fib1(0) -> 0;
fib1(1) -> 1;
fib1(N) ->
	fib1(N-1) + fib1(N-2).


% 14472334024676221 = fib2(78). % but failes in JS, due to conversion to float.
fib2(N) ->
	fib2(0, 1, N).

fib2(PrevPrev, Prev, 1) ->
	Prev;
fib2(PrevPrev, Prev, To) ->
	fib2(Prev, PrevPrev+Prev, To-1).

% uses fast squering of 2x2 matrices.
% http://en.literateprograms.org/Fibonacci_numbers_(Erlang)

fib3(N) ->
    {Fib, _} = fib3(N, {1, 1}, {0, 1}),
     Fib.

fib3(0, _, Pair) -> Pair;
fib3(N, {Fib1, Fib2}, Pair) when N rem 2 == 0 ->
    SquareFib1 = Fib1*Fib1,
    fib3(N div 2, {2*Fib1*Fib2 - SquareFib1, SquareFib1 + Fib2*Fib2}, Pair);
fib3(N, {FibA1, FibA2}=Pair, {FibB1, FibB2}) ->
    fib3(N-1, Pair, {FibA1*FibB2 + FibB1*(FibA2 - FibA1), FibA1*FibB1 + FibA2*FibB2}).

test_fib23(N) ->
	{TA,A} = timer:tc(example, fib2, [N]),
	{TB,B} = timer:tc(example, fib3, [N]),
	A = B,
	{ok,TA,TB}.

dd1(A,B,C,D) ->
	lists:seq(A,B) ++ lists:seq(C,D).

dd2(A,B) ->
	lists:reverse(lists:seq(A,B)).

dd3(A,B,C,D) ->
	lists:reverse(lists:seq(A,B), lists:seq(C,D)).

dd4() ->
	{lists:reverse(lists:seq(1,20),6), lists:reverse([],5)}.

dd5() ->
	{lists:seq(1,10),lists:seq(42,46),5}.

dd6() ->
	T = tl(lists:seq(1,10)),
	{T}.

dd7() ->
	T = hd(lists:seq(3,10)),
	{T}.

dd8(A,B) ->
	lists:sum(lists:seq(A,B)).

random(N) when N > 0 ->
	random(N, 18723, []).

random(0, _, L) -> L;
% this can overflow in JS, so it will produce other values. fix it later.
%random(N, S, L) -> random(N-1, (S*S*17263876+1237611) rem 871263761, [S|L]).
random(N, S, L) -> random(N-1, (S*1713+137) rem 8711, [S|L]).

rf(N) ->
	[ random:uniform() || _ <- lists:seq(1, N) ].

ri(N,Max) ->
	[ random:uniform(Max) || _ <- lists:seq(1, N) ].

dd9(N) ->
	random(N).


dd10(N) ->
	lists:sum(random(N)).

dd11(N) ->
	lists:filter(fun (X) -> ((X rem 3 == X rem 5)) end, random(N)).

dd12(N) ->
	L = dd9(N),
	{lists:sum(L)/length(L), 871263761/2}.


dd13(K,N) ->
	L = dd9(N),
	{lists:nth(K,L)}.

dd14(K,N) ->
	L = dd9(N),
	{lists:nthtail(K,L)}.

all(Pred, [Hd|Tail]) ->
    Pred(Hd) andalso all(Pred, Tail);
all(_, []) ->
    true.

none(Pred, [Hd|Tail]) ->
    Pred(Hd) orelse all(Pred, Tail);
none(_, []) ->
    true.

limit(X) ->
	X bsl (1 bsl 64).

s(X) ->
	math:pow(
		math:log(X*math:sin(X))/math:exp(math:tan(X*10.3-math:atan2(X,math:cos(X)))),
		math:sqrt(X)*math:pi()).

l1(K,N) ->
	L = dd9(N),
	A = [ K*X || X <- L ],
	{A}.


l2(K,N) ->
	L = dd9(N),
	L2 = lists:nthtail(N, dd9(2*N)),
	A = [ {K*X,Y} || X <- L, Y <- L2 ],
	{A}.

l3(K,N) ->
	L = dd9(N),
	A = [ {K*X,Y} || X <- L, Y <- dd9(X rem 4+1) ],
	{A}.


me() ->
	A = self(),
	{its_me,A}.


cross({V10,V11,V12}, {V20,V21,V22})
      when is_float(V10), is_float(V11), is_float(V12),
           is_float(V20), is_float(V21), is_float(V22) ->
      {V11*V22-V12*V21,V12*V20-V10*V22,V10*V21-V11*V20}.

cross2({V10,V11,V12}, {V20,V21,V22}) ->
      {V11*V22-V12*V21,V12*V20-V10*V22,V10*V21-V11*V20}.

cross3({V10,V11,V12}, {V20,V21,V22})
      when is_integer(V10), is_integer(V11), is_integer(V12),
           is_integer(V20), is_integer(V21), is_integer(V22) ->
      {V11*V22-V12*V21,V12*V20-V10*V22,V10*V21-V11*V20}.

oo1(X) when is_integer(X) ->
	true;
oo1(_) ->
	false.

oo2(X) ->
	is_integer(X).

oo3(X) ->
	erlang:is_integer(X).

hasz1(X) ->
	erlang:phash(X, 1 bsl 32).

