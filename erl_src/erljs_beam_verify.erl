-module(erljs_beam_verify).
-author('baryluk@smp.if.uj.edu.pl').

% Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
% erljs project

-export([verify/1]).

verify(B) ->
	todo.
	% chec that all registers are used properly
	% check arity of functions
	% that after function return only x[0] is readed
	% that at least x[0.. arity] is writen before calling known arity functions
	% that x[0] and x[1] are valid before bifs, like send ('!'), 't', 'is_atom', etc...
	% that labels are inside the same function as its usage
	% that 'jump' opcode wil not introduce unbound loops
	% that there are no opcodes after tail-call
	% that 'put'/'put_tuple' are used correctly (correct number of 'put''s, in correct order, consecutivly)
	% that there is always 'r' or tail-call at the end of each exec path
	% that 'try'/'try_case'/'catch'/'catch_end',  'case'/'case_end', 'loop_rec'/
	% that label referenced in 'wait'/'wait_timeout' is point to 'loop_rec'
	% that 'remove_message' is used after 'loop_rec'
	% that 'wait'/'timeout' is after 'loop_rec', and that error label referenced in 'loop_rec' points to 'wait'/'wait_timeout'/'timeout'
