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
	apply(E, lists, a).

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
	erljs:eval("alert('kuku')").

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
	L=lists:seq(N, N+100),
	{lists:nthtail(T, N)}.

llll_z(N) ->
	L1=lists:seq(N, N+10),
	L2=lists:seq(N+310, N+320),
	{lists:zip(L1,L2)}.


llll_u(N) ->
	{LZ} = llll_z(N),
	{lists:unzip(LZ)}.

