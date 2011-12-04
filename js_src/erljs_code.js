/* Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
 * erljs project
 */

var all_modules = [
	["erljs_kernel", module_erljs_kernel],

	["random", module_random],
	["lists", module_lists],
	["orddict", module_orddict],
	["ordsets", module_ordsets],
	["string", module_string],
	["queue", module_queue],
	["dict", module_dict],
	["proplists", module_proplists],
	["sets", module_sets],
	["gb_trees", module_gb_trees],
	["gb_sets", module_gb_sets],
	["regexp", module_regexp],
	["example", module_example],

	["erlang", module_erlang],

	["otp_ring0", module_otp_ring0],
	["init", module_init],
	["sys", module_sys],
	["supervisor", module_supervisor],
	["supervisor_bridge", module_supervisor_bridge],
	["proc_lib", module_proc_lib],
	["gen", module_gen],
	["gen_event", module_gen_event],
	["gen_fsm", module_gen_fsm],
	["gen_server", module_gen_server],
	["error_logger", module_error_logger],

	["genser_test", module_genser_test],
	["genser_test2", module_genser_test2],

	["tests_auto", module_tests_auto],

	["erl_internal", module_erl_internal],
	["erl_scan", module_erl_scan],
	["erl_parse", module_erl_parse],
	["erl_lint", module_erl_lint],
	["erl_eval", module_erl_eval],
	["erl_pp", module_erl_pp],

];
