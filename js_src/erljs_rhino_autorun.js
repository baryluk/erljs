/* Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
 * erljs project
 */

//load("prototype.js");

load("erljs_datatypes.js");

load("erljs_scheduler_list.js");
load("erljs_scheduler.js");

load("erljs_vm.js");

// stdlib
load("erljs_code/random.beam.js"); // needs put, and get, trunc and abs
load("erljs_code/lists.beam.js"); // list is one of the biggest module, 7kOps (before removing labels, etc.)
load("erljs_code/orddict.beam.js"); // other have on avarage 1kOps, minimum 400kOps, maximum 2kOps
load("erljs_code/ordsets.beam.js");
load("erljs_code/string.beam.js");
load("erljs_code/queue.beam.js");
load("erljs_code/dict.beam.js"); // need erlang:phash(Term,MaxN), erlang:error, list_to_tuple and tuple_to_list
load("erljs_code/proplists.beam.js");
load("erljs_code/sets.beam.js");
load("erljs_code/gb_trees.beam.js");
load("erljs_code/gb_sets.beam.js");
load("erljs_code/regexp.beam.js");

// digraph // need lists, ets, queue
// sofs // needs lists, digraph

// base64.erl rewrite to native

// my manual micro tests
load("erljs_code/example.beam.js");

// automatically generated js/erl/beam.js from test specification
load("erljs_code/tests_auto.beam.js");
load("tests_auto.js");

load("erljs_code.js");

load("erljs_control.js");


(function () {
	function unittest__small_rhino_tests() {
	eq("example:sum2(10,20)",32);
	eq("example:sum2(10,-20)",-8);
	eq("example:sum2(10,-10)",2);
	eq("example:sum2(10,-10)",2);
	eq("example:sum2(10,1.5)",13.5);
	}

	unittest__small_rhino_tests();
//	unittest__term_decode(true,true);
	unittest__run_examples();
	unittest__tests_auto();
})();

