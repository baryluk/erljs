-module(term).
-export([encode/1]).
-author("Witold Baryluk <baryluk@smp.if.uj.edu.pl>").
-vsn("1.0").

encode(X) -> io_lib:format("~100000000P", [ X, 100000000 ]).

