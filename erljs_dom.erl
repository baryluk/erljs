-module(erljs_dom).

-compile([export_all]).
-compile_erljs([export_all]).


%-spec selector(any) -> {ok, [dom_node()]} | {error, term()}.
selector(Spec) when is_atom(Spec); is_list(Spec) ->
	ignored.

%-spec get_by_id(dom_id()) -> {ok, dom_node()} | undefined | {error, term()}.
get_by_id(Id) when is_atom(Id) ->
	%throw (callable_only_at_client_side).
	ignored.

% after starting listening, there will be message of the form:
%   {dom, Id, Ref, Type, Value, Aux}
%
% Opts:  once - after single event unregiter this listener
%        prevent_default - prevent default action from exeucting (like clicking on link going to new page)
%        stop_propagation - do not propagte to the other elements in DOM tree
%        capture - send message in capture phase instead of bubbling
%                  (and possibly stop_propagation/prevent_default based on other options)
%
% Returns: {ok, Ref}, after sucessfull registering listner
%          {error, Reason}, if no such element
%
% throws badarg, if bad arguments
%
%-spec listen(dom_id_or_node(), atom(), [once | prevent_default | stop_propagation | capture], term()) ->
%	{ok, ref()} | {error, term()}.
listen(Id, Type, Opts, Aux) when is_atom(Id), is_atom(Type), is_list(Opts) ->
	%throw (callable_only_at_client_side).
	ignored.

%-spec close(dom_id_or_node() | ref(), atom()) -> {ok, term()} | {error, term()}.
close(IdOrRef, Type) when is_atom(IdOrRef), is_atom(Type) ->
	ignored.

% after starting listening, there will be message of the form:
%   {ajax_progress, Ref, SoFarBytes, TotalBytes}
%   {ajax_data, Ref, {Status, Headers}, DataList}
%   {ajax_error, Ref, abort | timeout | other}
%
% Opts:  binary - use binaries instead of list
%        sync - wait for result and return {Status, Headers, DataList}
%        prevent_caching - append random query string and set headersto prevent caching
%
% Returns: {ok, Ref} - in async mode (defult) without error
%          {Status, Headers, DataList | Binary} - in sync mode without error
%          {error, Reason} - on error
%
% throws badarg, if bad arguments
%


% TODO
% wszystkie -spec są tutaj zakomentowane, bo sie nie kompiluje w nowerj wersji erlanga :(
%-spec ajax(
%		'GET' | 'POST' | 'HEAD' | 'PUT' | 'DELETE',
%		io_list(),
%		io_list(),
%		[binary | sync | prevent_caching]
%	) ->
%		{ok, ref()} |
%		{pos_integer(), [{io_list(), io_list()]}, io_list()} |
%		{error, term()}.
ajax(Method, URL, Data, Opts) when is_atom(Method), is_list(URL), is_list(Data), is_list(Opts) ->
	ignored.


% DOM manipulation

%-type dom_id() := atom() | string().
%-type dom_node() := {dom_node, ref()}.
%-type dom_id_or_node() := dom_id() | dom_node().
%-type dom_prop() := atom() | string().
%
%-type html_props() := style | parentNode | nodeName.

%-spec window() -> {ok, dom_node()} | {error, term()}.
window() -> ignored.

%-spec create_element(string()) -> {ok, dom_node()} | {error, term()}.
create_element(Type) -> ignored.

%-spec create_element(string(), dom_node()) -> {ok, dom_node()} | {error, term()}.
create_element(Type, Window) -> ignored.

%-spec create_element(io_list(), dom_id_or_node()) -> {ok, dom_node()} | {error, term()}.
create_text_node(Text, Document) -> ignored.

%-spec parent(dom_id_or_node()) -> {ok, dom_node()} | {error, term()}.
parent(IdOrNode) -> ignored.

%-spec childs(dom_id_or_node()) -> {ok, [dom_node()]} | {error, term()}.
childs(IdOrNode) -> ignored.
%-spec append_childs(dom_id_or_node(), dom_node()) -> ok | {error, term()}.
append_child(IdOrNode, Node) -> ignored.
%-spec insert_childs(dom_id_or_node(), dom_id_or_node(), dom_node()) -> ok | {error, term()}.
insert_child(IdOrNode, Id2OrNode, Node) -> ignored.
%-spec append_childs(dom_id_or_node(), dom_id_or_node()) -> ok | {error, term()}.
remove_child(IdOrNode, Id2OrNode) -> ignored.

%-spec get(dom_id_or_node(), dom_prop()) -> {ok, term()} | {error, term()}.
get(IdOrNode, Prop) -> ignored.
%-spec set(dom_id_or_node(), dom_prop(), io_list() | dom_id_or_node()) -> ok | {error, term()}.
set(IdOrNode, Prop, Value) -> ignored.
%-spec set(dom_id_or_node(), dom_prop(), io_list() | dom_id_or_node(), string()) -> ok | {error, term()}.
set(IdOrNode, Prop, Value, NS) -> ignored.
%-spec clear(dom_id_or_node(), dom_prop()) -> ok | {error, term()}.
clear(IdOrNode, Prop) -> ignored.
%-spec append(dom_id_or_node(), dom_prop(), io_list()) -> ok | {error, term()}.
append(IdOrNode, Prop, Value) -> ignored.
%-spec preppend(dom_id_or_node(), dom_prop(), io_list()) -> ok | {error, term()}.
preppend(IdOrNode, Prop, Value) -> ignored.

%-spec get_style(dom_id_or_node(), css_prop()) -> {ok, term()} | {error, term()}.
get_style(IdOrNode, Prop) -> ignored.
%-spec set_style(dom_id_or_node(), css_prop(), io_list() | atom()) -> ok | {error, term()}.
set_style(IdOrNode, Prop, Value) -> ignored.

%-spec clone(dom_id_or_node()) -> {ok, dom_node()} | {error, term()}.
clone(IdOrNode) -> ignored.

%-spec deep_clone(dom_id_or_node()) -> {ok, dom_node()} | {error, term()}.
deep_clone(IdOrNode) -> ignored.
