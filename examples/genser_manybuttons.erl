-module(genser_manybuttons).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-behaviour(gen_server).

-export([start/0, start_link/0]).
-export([stop/0]).
-export([alloc/0, free/1]).
-export([init/1, handle_call/3, handle_cast/2, handle_info/2, terminate/2, code_change/3]).

% starting api

start() ->
    gen_server:start({local, ?MODULE}, ?MODULE, [], []).
start_link() ->
    gen_server:start_link({local, ?MODULE}, ?MODULE, [], []).

% external interface

alloc() ->
    gen_server:call(?MODULE, alloc).
free(Ch) ->
    gen_server:cast(?MODULE, {free, Ch}).
stop() ->
    gen_server:cast(?MODULE, stop).

% gen_server interface

init(_Args) ->
	{ok, _} = erljs:listen(przycisk1, click, [], {}),
	{ok, _} = erljs:listen(przycisk2, click, [], {}),
	{ok, _} = erljs:listen(digits_clear, click, [], {clear}),
	Digits = [
		{digit1, 1},
		{digit2, 2},
		{digit3, 3},
		{digit4, 4},
		{digit5, 5},
		{digit6, 6},
		{digit7, 7},
		{digit8, 8},
		{digit9, 9},
		{digit0, 0}],
	[ {ok, _} = erljs:listen(Id, click, [], {digitsX, Digit}) || {Id, Digit} <- Digits ],
 %   {ok, channels()}.
	erljs:set(pole1, value, {initialized, ?MODULE, self()}),
    {ok, []}.

handle_call(alloc, _From, Chs) ->
    case alloc(Chs) of
       {void, Chs2} -> {reply, void, Chs2};
       {Ch, Chs2} -> {reply, Ch, Chs2}
    end.

handle_cast({free, Ch}, Chs) ->
    Chs2 = free(Ch, Chs),
    {noreply, Chs2};
handle_cast(stop, State) ->
    {stop, normal, State}.

handle_info({dom, _Id, _Ref, _Type, _Value, {digitsX, D}} = _E, State) ->
	State2 = [$0+D|State],
	erljs:set(pole1, value, State2),
    {noreply, State2};
handle_info({dom, _Id, _Ref, _Type, _Value, {clear}} = _E, _State) ->
	State2 = [],
	erljs:set(pole1, value, State2),
    {noreply, State2};
handle_info({dom, _Id, _Ref, _Type, _Value, _} = E, State) ->
	erljs:set(pole1, value, {received_dom_event, erlang:localtime(), E}),
    {noreply, State};
handle_info({'EXIT', _Pid, _Reason}, State) ->
    {noreply, State};
handle_info(M, State) ->
	erljs:set(pole1, value, {unknown_msg, M}),
    {noreply, State}.

terminate(normal, _State) ->
    ok.

code_change(_OldVersion, State, _Extra) -> {ok, State}.

% internal api

channels() ->
   {_Allocated = [], _Free = lists:seq(1,10)}.

alloc({Allocated, [H|T] = _Free}) ->
   {H, {[H|Allocated], T}};
alloc({_Allocated, []} = Channels) ->
   {void, Channels}.

free(Ch, {Alloc, Free} = Channels) ->
   case lists:member(Ch, Alloc) of
      true ->
         {lists:delete(Ch, Alloc), [Ch|Free]};
      false ->
         Channels
   end.
