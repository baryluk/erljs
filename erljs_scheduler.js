// requires("erljs_scheduler_list.js"); // to load
// requires("erljs_vm.js"); // to run



/** Debug all scheduler decisions, state of scheduler, processes, process in/out, spawn, exit, timeouts, and message scheduling. */
function erljs_scheduler_log(X) {
//	print(X);
	console.log(X);
//	alert(X);
}

// Process
var Proc = function() {};

// state of Process
// some fields are commented, becuase to save space we only create them if nacassary, and when they are not used anymore, are deleted
Proc.prototype = {
	Pid: null,
	Node: 0,
	State: 0,
/*
0 - PREPARING - process is not running yet - it is for example prepared to be spawned
1 - RUNNING - executing right now (for example in other WebWorker or IFrame)
2 - RUNNING_KERNEL - executing right now but in the "kernel/native" code. cannot be stoped (preempted) immiedietly.
3 - READY - if can be immiedietly runneded
4 - BLOCKED - blocks on some event (waiting for message or timeout)
5 - BLOCKED_RETRY - has been in BLOCKED state, but new unprocessed message arived (from other process or AJAX response/DOM event) or timeout triggered.
6 - ENDED - VM told us that this processed ended it execution.
7 - EXITED - proces ended it's life, but still need to be removed/cleaned from process list, or link signals need to be propagated.
*/
	//Heap: [],
	Stack: [], // Stack also have exception handlers and local instruction pointer.
		// Top of stack is current frame (it is pushed on exit of vm and poped on reentry)
	LocalEH: [],
	Regs: [],
	LocalRegs: [], // TODO: unift Regs and LocalRegs into [2] array, and select with branches.
	FloatRegs: [], // floating point registers
	ProcessDict: {},
	MsgQueue: [],
	Timeout: -1,
	Links: [],
//	Prio: 0,
//	Tracing: null,
//	OpCodeProfile: {}, // Opcode profiler
	Reductions: 0,
	NativeReductions: 0,
//	put_tuple_register: -1, // needs to be remembered, because constructing tuple is statefull and not atomic
//	put_tuple_i: -1 // ditto.
//	last_reason: null // "noreason" // used by floating point exception handling, any other?,
	FloatError: false,
//	InitialFunction: null, // [M,F,A] of initial function
//	InitialArgs: null // arguments for initial function
//	CreatedAt: null, // Date() at which process was created
//	Parent: null, // which process spawned it
	CPUTime: 0 // Cumulated active runing time in miliseconds
};

var NodeConfig = function() {};
NodeConfig.prototype = {
	Schedulers: null,
	VMengines: null,
	AllProcesses: {}, // hashed be EPid
	RegisteredProcess: null, // Pid -> atom
	RegisteredProcess2: null, // atom -> Pid
	Modules: {}, // list of all modules in newest versions
	OldModules: {}, // list of all modules in old versions
	AllFunctions: {} // hashed by M:F/A
};

var ThisNode;

// VM engine (to run processes), without scheduler, because there can be multiple VM engines on each CPU core.
var VMengine = function() {};
VMengine.prototype = {
	CurrentProcess: null,
	RunQueue: [] // per VM engine
};

// TODO: registered process (per VMengine? no, becuase we can have multiple scheduler on different WebWorkers, but it is the same node, so no).


/* prepare structures for VM scheduler
 * initialize all needed values
 */
function erljs_scheduler_setup() {
	Array.prototype.enqueue = function(x) {
		erljs_scheduler_log("Enqueued message "+x.toString());
		this.push(x);
		return false;
	};
	Array.prototype.dequeue = function(x) {
		return this.shift();
	};

	ThisNode  = new NodeConfig();

	//vm = new VMengine();

	// maping: Pid -> ProcNode
	ProcessHash = {};

	// maping: event -> [Pid]
	erljs_events_hash = {};

	// for scheduler
	ProcessList = new LinkedList.Circular();
	// for scheduler, to find next process to run
	LastProcessNode = null;
};

// event -> [Pid]
var erljs_events_hash;


/* It is safe to remove listener, when processin. It is is guaranted the the given listener will not be called if it was removed.
 * Removing listener which isn't registers do not have any effect (no error, no exception).
 */
function add_handler(x, type, dg, useCapture, data, once) {
if (x.addEventListener) {
	// add EventListener using DOM2b style
	var listener = {
		ctx: data,
		type: type,
		stop: false
	};
	if (once) {
		listener.handleEvent = function(event) {
			x.removeEventListener(type, this, useCapture);
			this.event = event;
			dg(this);
		};
	} else {
		listener.handleEvent = function(event) {
			this.event = event;
			dg(this);
			return this.stop;
		};
		listener.remove = function() {
			x.removeEventListener(type, this, useCapture);
		};
	};
	x.addEventListener(type, listener, useCapture);
	return listener;
} else if (element.addEventListener) {
	// add EventListener using DOM2 style
	var d = {
		ctx: data,
		type: type,
		stop: false
	};
	d.handleEvent = function(event) {
		d.event = event;
		if(once) {
			d.remove();
		}
		dg(d);
		return d.stop;
	};
	d.remove = function() {
		x.removeEventListener(type, d.handleEvent, false);
	};
	x.addEventListener(type, d.handleEvent, false);
	return d;
} else if (element.attachEvent) {
	// add using Internet Explorer
	//element.attachEvent("on"+type, listener); // Internet Explorer
}

alert("DOM2 enabled browser needed for now.");

}

function erljs_create_listener(element, type, external, useCapture, data) {
	var listener = add_handler(x, "click", function(d) {
		return erljs_scheduler_continue_event(d.event, d.ctx, external, element);
	}, false, {}, true);

	return listener;
}



// Start http request.
// There is also other possible ways to emulate this (like hidden iframes)
function http_new() {
	var x = null;
	if (typeof XMLHttpRequest != 'undefined') {
		x  = new XMLHttpRequest();
		if (x.overrideMimeType) {
			x.overrideMimeType('text/plain');
		}
	} else if (typeof window !=  'undefined') {
		if (window.ActiveXObject) {
			try {
				x = ActiveXObject("Msxml2.XMLHTTP");
			} catch (e) {
				try {
					x = new ActiveXObject("Microsoft.XMLHTTP");
				} catch (e) { }
			}
		} else if (window.createRequest) {
			x = window.createRequest(); // ?
		}
	}
	if (!x) {
		erljs_scheduler_log("We are sorry, but your browser is not supported. Please consider upgrading your browsing");
	}

	return x;
}

function http_go1(url) {
	var x = http_new();
	if (x) {

	var releated = {};

	releated.load = erljs_create_listener(x, "load", true, false, x);
	releated.error = erljs_create_listener(x, "error", true, false, x);
	releated.progress = erljs_create_listener(x, "abort", true, false, x);
	releated.abort = erljs_create_listener(x, "progress", true, false, x); // if exists
	releated.load.releated = releated;
	releated.error.releated = releated;
	releated.progress.releated = releated;
	releated.abort.releated = releated;

//	releated.change = erljs_create_listener(x, "readystatechange", true, false, x);
//	releated.change.releated = releated;

	x.open("POST", url, true); // async

	x.send(null);
	}
	return x;
}

function http_go() {
	var handler = function (type, k) {
		var http = k.http;

		erljs_scheduler_log("Handling event: "+type + " Ready state: "+http.readyState);

		function info() {
			erljs_scheduler_log("Event info: "+type);
			if (http.status == 200) {
				erljs_scheduler_log("OK: "+http.responseText);
			} else {
				erljs_scheduler_log("Not OK"+http.status);
			}
		}

		try {
			if (type == "change") {
				if (http.readyState == 4) {
					info();
				}
			} else {
				if (type  == "load") {
					info();
				} else {
					erljs_scheduler_log("Event: "+type);
				}
			}
		} catch (e) {
			// request can be completed (readyStatus = 4),
			// but it can be broken (for example server went down and TCP conection terminated), in such case http.status will throw error
			erljs_scheduler_log('Exception when processing response: ' + e.description);
		}
	};
	var x = http_go1("http://localhost/~baryluk/erljs/ajax_test");
	if (!x) { erljs_scheduler_log("HTTP request failed"); }
	//add_timeout(5000, x, handler);
}


// var type = "click";
// var element = window; //window object, document object, DOM node/element object, XMLHttpRequest object
// var listener = erljs_create_listener(element, type, 0, false, {});
// //element.dispatchEvent(event);
//
//

// internal
/* continue executing of VM processes after event of some kind in DOM
 * occured and dispatch it to proper erljs processes
 */

// external
/* continue executing of VM processes after event of some kind in
 * AJAX requests (both success and error),
 * occured and dispatch it to proper erljs processes
 */

/* helper function for above two
 *
 * It handles both external (AJAX responses) and internal (DOM events) messaging.
 * Handling of messages beetwen local processes and from local process to
 * the Erlang server, AJAX requests or sending actions to DOM, is in different place.
 *
 * TODO: after receiving event we should schedule the target processes witch are now blocked,
 *       (if there are no other running process, scheduler will find them anyway and run quickly,
 *        but this could be made O(1).).
 *
 * TODO: support receving data using postMessage.
 *
 * TODO: possibly add support for JS custom events, (currently not used in any major framework)
 */
function erljs_scheduler_continue_event(event, data, external, element) {
	window.clearTimeout(erljs_timeout_timer_id);
	var Pids = erljs_events_hash(event);
	if (!Pids) {
		throw "Internal error - unknown event!";
	}
	var e = event;
	if (external) {
		// two possibilities:
		// 1. we can have standard AJAX request, XML/JSON, etc. parse it to list/binary.
		// 2. we can have something from the Erlang server. parse it (possibly multiple messages), dispatch to the processes, and restart comet.

		// find AJAX request reference.
		var ref = 0;

		e = new ETuple(new EAtom('ajax_progress'), ref, 12312, 18172837);
		e = new ETuple(new EAtom('ajax_data'), ref, "data"); // headers? mime-type? status code?
		e = new ETuple(new EAtom('ajax_error'), ref, new EAtm("abort")); // abort, timeout, other
	} else {
		// this is something from the DOM

		// Find a DOM element reference.
		var ref = 0;
		var event = new EAtom("click");

		e = new ETuple(new EAtom('dom'), ref, event);
	}

	for (Pid in Pids) {
		// some events are registered once in DOM, but was registered multiple times in the Erlang, so dispatch them.
		// this doesn't happen for AJAX, but this is generic.
		var ProcNode = ProcessHash[Pid];
		if (ProcNode) {
			var p = ProcNode.data;
			if (p.State != 6) { // not EXITING
				// TODO: synchronize or re-send localy, if process in on the different Worker
				p.MsgQueue.enqueue(e);
				if (p.State == 4) { // BLOCKED
					p.State = 5; // BLOCKED_RETRY
				}
			}
		} else {
			throw "Internal error";
		}
	}
	erljs_vm_consume();
}


/* continue execution of VM processes.
 * this function should be executed by function which was called explicitly
 * from the JS code, in event of call from erljs code.
 * this function will with high probablity continue execution of
 * the relevent process (at the call point of JS code)
 * - comm_handler is opaque value provided to function,
 * - value is return value of JS code which will be presented
 *   as return value of function,
 * - continuer is optional JS closure which will be executed on completion of
 *   erljs code process, or explicit return will be given for this communication
 *   handler (this allows VM to continue execution of this code path
 *   at different time, so browser doesn't stall),
 *   (this allow for simple synchronous ping-pong messaging beetwen
 *    single erljs and multiple JS)
 */
function erljs_scheduler_continue_from_js(comm_handler, value, continuer) {
	throw "Not implementd yet";
}

// List of all processes
var ProcessList;

// Process list node which have been scheduled on previous tick and have been run then
var LastProcessNode;

// Mapping of Pid -> ProcessNode
var ProcessHash;


/* Add new process to the ProcessList.
 *
 * TODO: if spawning process (parent) will block quickly or go into "after" quickly, we should probably
 * schedule this new spawned process using remaining CPU time of its parent process.
 * If this spawned process will return message back or forward it somewhere, it should be also recursivly handled.
 * This will improve response time in client-server scenario, and small-workers+wait scenario.
 */
function erljs_spawn(Proc) {
	Proc.State = 3;

	var node = new LinkedList.Node(Proc);

	ProcessHash[Proc.Pid] = node;

	ProcessList.append(node);

	erljs_scheduler_log("New process "+Proc.Pid+" created, spawned, and added to the process list");
}

/* Removes existing process list node from ProcessList,
 * and sends appropriate messages/'EXIT' signal to all linked process.
 *
 * We also cancel all outstanding timers, file descriptors, ajax handlers, dom handlers associaied with this Pid.
 *
 * In case we cannot remove them (becuase AJAX request already appeared), we intercept needed data and ignore it
 * (we could send it to the 'default' process, etc.)
 */
function erljs_terminate(ProcNode) {
	var Proc = ProcNode.data;
	Proc.State = 6;

	if (LastProcessNode === ProcNode) {
		LastProcessNode = LastProcessNode.prev;
	}
	if (LastProcessNode === ProcNode) {
		LastProcessNode = null;
	}

	ProcessList.remove(ProcNode);

	delete ProcessHash[Proc.Pid];

	// Extract returned (exit) value, or exception info.
	// Iterate over all linked process (also remove) and send appropriate messages.

	// Remove all timers, dom and ajax listeners.

	erljs_scheduler_log("Process "+Proc.Pid+" destroyed, ended and removed from process list.");
}

/* Choice process from ProcessList to be run now. Return null, if there is no processes or all are in blocked state
 * (waiting for message, no new messages in transit, and timeout not yet occured)
 *
 * It is possible that this method will return null, but in moment of return it is possible that some process can be runed,
 * because new message arived or timeout just occured. We do not handle such case, just reenter this function again, if needed.
 *
 * If this method returns null, then it is good to run erljs_compute_timeout() to determine timeout on which to schedule again.
 * TODO: This method should determine it on it's own, becuase it already traverses process lists and examines states.
 *
 * If method returns not-null, then it modifies LastProcessNode variable.
 */
function erljs_schedule() {
	/* Simplest possible scheduler, just iterate over every process and select first possible process, different than previous if possible. */
	/*
	 * In the future we can make it much better, like sorting processes in tree like in CFS by wait time.
	 *
	 * We could also implement optimialisations like:
	 *   - on spanw: schedule and run just spawned new process first (it could be short running task)
	 *   - on send: schedule and run process which is target of the message (it could process it quicker, reducing over latency, it will also help prevent explosion of message queue of this target process)
	 *       it should work if possible recursively. If the target sends other message somewhere becuase of processing of original message, then this 3rd process should be scheduled.
	 *       Greate care need to be taken when implementing it. Becuase it can prevent runing other process for long time.
	 *
	 * Other important thing could be scheduling a process which just received a message and was in blocking state, becuase he is waiting for it.
	 * (if we have many tasks which are cpu intesive, then not doing so will introduce big delays)
	 * The same with process which was in the blocked state, but with timeout. We should run them as quickly as possibly after the timeout passed,
	 *
	 * becuase they could be useing it for precise timeing, so delay can hurt here, especially when other process will consume many cycles.
	 *
	 */
	var ProcNode_first = LastProcessNode;

	if (!ProcNode_first) {
		ProcNode_first = ProcessList.first;
	}

	if (!ProcNode_first) {
		return null; // no processes to run
	}

	var min;

	var ProcNode = ProcNode_first.next;

	do {
		var min2 = erljs_schedule_examine(ProcNode.data);
		if (min2 >= 0) { // READY or BLOCKED with timeout
			min = (min2 < min ? min : min2); // also correct if min==undefined
		}
		if (min2 == 0) { // READY
			LastProcessNode = ProcNode; // save it for next scheduling
			return ProcNode;
		}
		ProcNode = ProcNode.next;
	} while (ProcNode !== ProcNode_first);

	if (min === undefined) { // no processes or all processed are blocked or running
		min = -1;
	}

	return null; // no runnable processes founded
}

/* Run scheduled process */
function erljs_schedule_run() {
	if (LastProcessNode) {
		var r = erljs_go(LastProcessNode.data);
		if (!r) {
			erljs_terminate(LastProcessNode);
		}
		return 0;
	}
	return -1;
}

function erljs_go(P) {
	if (!(P.State == 3 || P.State == 4 || P.State == 5)) { // not READY or BLOCKED or BLOCKED_RETRY
		throw "Not runnable process";
	}
	//P.state = 2; // RUNING_NATIVE
	P.State = 1; // RUNING
	//P.FullDebug = 1;
	var r = erljs_vm_steps_(P);
	if (r) {
		P.State = 6; // ENDED
		return false;
	} else {
		P.State = 3; // READY
	}
	return true;
}

/** Examines single process state.
 *
 * It returns
 *       0 - if this process can be immedietly scheduled for execution do the the fact that process is running some code or new message appeared, or there was "after 0".
 *   T > 0 - if process is waiting for messages, but there is timeout T miliseconds.
 *      -1 - if this process cannot be scheduled, becuase there is no timeout, timer or it already dead.
 */
function erljs_schedule_examine(Proc) {
//erljs_schedule_log("examining Pid="+Proc.Pid + " State="+Proc.State);
	if (Proc.State == 3 || Proc.State == 5) { // READY state // we can immiedietly run this code
		                                      // or BLOCKED_RETRY // we should immiedietly run this code to process new messages
		return 0;
	}
	if (Proc.State == 4) { // BLOCKED state // we are in receive statment and no message matched.
		if (Proc.Timeout !== null) {
			return Proc.Timeout;
		} else {
			return -1; // no "after T" construct or "after infinity" construct.
		}
	}
	if (Proc.State == 1 || Proc.State == 2) { // RUNNING state // we are just executing some erlang code some right now
		return -1;
	}
	if (Proc.State == 5 || Proc.State == 6) { // ENDED or EXITED state
		return -1;
	}
	throw "Internal error. Unknown Process state: "+Proc.State;
}

/** Finds smallest timeout (in miliseconds) which can be safely handled to meet all 'after' and timer requirements.
 *
 * This code will return 0, if there was recently new message beetwen local processes,
 * queued into other process message queue, but not yet processed by second process.
 *
 * In other case, it is safe to assume that ALL process waits for event from DOM event, AJAX response,
 * receive timeout or timer message.
 *
 * DOM events and AJAX responses are handled by erljs_scheduler_continue_{internal,external}_event.
 *
 * Both timer and timeout are handled using erljs_scheduler_continue_timeout.
 *
 * If method returns 0, this means that:
 *   - there is some work to do in the code,
 *   - there is unprocessed messages,
 *   - or some timeout/timer is already to be triggered.
 *
 * If method returns integer T > 0:
 *   - all process are blocked in some way, and first process to be weaken up will wait T miliseconds.
 *
 * If methos returns -1, that mean that there are:
 *   - no processes
 *   - all are running on different CPU or blocked waiting for event (and do not have "after" section)
 *
 * TODO: Make this O(1), by computing nacassary global data by scheduler when preempting every process.
 */
function erljs_compute_timeout() {
	var ProcNode = ProcessList.first;

	var ProcNode_first = LastProcessNode;

	if (!ProcNode_first) {
		ProcNode_first = ProcessList.first;
	}

	if (!ProcNode_first) {
		return null; // no processes to run
	}

	var min;

	do {
		var min2 = erljs_schedule_examine(ProcNode.data);
		if (min2 >= 0) { // READY or BLOCKED with timeout
			min = (min2 < min ? min : min2); // also correct if min==undefined
		}
		ProcNode = ProcNode.next;
	} while (ProcNode !== ProcNode_first);
	if (min === undefined) { // no processes or all processed are blocked or running
		return null;
	}
	return min;
}

// timer ID which we use for reentring on timeouts, and incremental execution
var erljs_timeout_timer_id;

// there is minimal delay of 10ms in most browsers (10ms in IE, 5ms in Gecko).
// HTML5 defines minimal delay of reexecution as 4ms
var erljs_timeout_timer_timeout = 10; // miliseconds
/* for 0ms delay one can use:
 *   on starting side:  window.postMessage(message, targetOrigin)
 *   on ending site:
 *     window.addEventListener("message", receiveMessage, false);
 *     function receiveMessage(event) {
 *       if (event.origin !== "http://example.org:8080") return;
 *       event.source // the 'window' object of sending side
 *       event.data
 *     }
 */

// main entry point for starting whole system
function erljs_start_vm() {
	erljs_scheduler_log("Starting VM and scheduler");
	erljs_scheduler_setup();
	var Modules = all_modules;
	erljs_scheduler_log("Initializing modules");
	erljs_vm_init(Modules);
	erljs_scheduler_log("Starting erljs_kernel:init/0");
	var InitProcess = erljs_vm_call_prepare(["erljs_kernel", "init", 0], [], 1000, true);
	erljs_spawn(InitProcess);
	erljs_scheduler_log("Setting timeouts");
	erljs_timeout_timer_id = window.setTimeout(erljs_scheduler_continue_increment, erljs_timeout_timer_timeout);
	erljs_scheduler_log("System started.");
}


/* continue executing of VM processes after some timeout occured
 * this can happen becuase of usage of receive after construct,
 * or timer:* functions or after network error timeout on some request,
 * this method tries finding best process to run it further
 *
 * Pid is undefined or a Pid object of the process, which we are hiting timeout for
 */
function erljs_scheduler_continue_timeout(Pid) {
	erljs_scheduler_log("*** Context switch in - 'continue timeout'");
	erljs_vm_consume();
}

/* continue execution of VM process after some small amount of time
 * this is mainly used to not block entried browser UI on
 * long runing erljs jobs, and to receive events from DOM and/or AJAX.
 */
function erljs_scheduler_continue_increment() {
	erljs_scheduler_log("*** Context switch in - 'continue increment'");
	erljs_vm_consume();
}

var erljs_vm_consumptions = 0;

/** We are using hybrid scheduling.
 *
 * We are using preemptive schduling for out erlang processes.
 * But we also need to cooperativly give time for other JS code.
 *
 * Scheduler works by: executing some small amount of Erlang code,
 * (small by means of number of opcode, or time it takes to execute),
 * possibly executing the same process multiple times.
 *
 * When it is done, it reenter itself using JS timers, allowing
 * other scripts on the site also to run, as well as to trigger
 * internal and external events (DOM events and AJAX events).
 *
 * Even if some Erlang processes are blocked (becuase for example they sended AJAX request),
 * we can still execute other Erlang processes without a problem.
 *
 * In fact it can be even more efficient than just exiting, and waiting for an AJAX event handler,
 * becuase of the fact that request will take some time.
 *
 * By executing some code in the same time
 * (we assume browser already started request and is also retriving response, and added handler call to the call queue).
 * we make better usage of the CPU (in the same or other process).
 *
 */
function erljs_vm_consume() {
	erljs_vm_consumptions++;

	// what is the total time to be consumed by this function (sum of all processes executed here)
	var max_reductions = 50000;
	var max_time = 80; // miliseconds

	// how big is a maximal time-slot we are giving to each process.
	// (it can be smaller if process ended or entered a blocked state)
	// (it can be bigger if process used native non-preemptible function)
	var quantum_reductions = 5000;
	var quantum_time = 5;

	// TODO: we should base our quantum_* number on the number of runnable threads
	// (and if possibly modify them if new processes are spawned, other terminated, entered a blocking state,
	// or some processes just have delivered message or they timeout passed).

	erljs_scheduler_log("Starting consuming");

	var reductions = 0;
	var start = (new Date()).getTime();
	var end = start;
	do {
		var next_process = erljs_schedule();

		if (next_process) {
			var S = next_process.data;
			erljs_scheduler_log("Scheduled and running process "+S.Pid);
			S.MaxReductions = max_reductions;
			var r = erljs_schedule_run();
			if (r < 0) { throw "Internal error"; }
			reductions += S.Reductions;
			erljs_scheduler_log("Process execution done (interpreter returned, after "+S.Reductions+" reductions)");
		} else {
			erljs_scheduler_log("Scheduler did not found any process to run.");
			// no process to run
			var timeout = erljs_compute_timeout();
			erljs_scheduler_log("Computed timeout "+timeout);
			// TODO: if needed we can add precautions for very big timeouts.
			if (timeout !== null && timeout >= 0) {
				erljs_scheduler_log("But there is one with timeout "+timeout);
				// all process are blocked, but there is at least one "after" timeout
				erljs_timeout_timer_id = window.setTimeout(erljs_scheduler_continue_timeout, timeout);
				// TODO: add a pid as a parameter, so one wakeup there will be no need to search it again (and other event will not distrupt this)
				erljs_scheduler_log("Ended consuming (nothing to consume for now). Waiting for rentry on event or calculate timeout.");
				return;
			} else {
				erljs_scheduler_log("And there is no processes at all or all blocked without timeout.");
				// all process are completly blocked and none have specified "after" timeout (or it is infinity).
				// we are not setting any timer, but assume that external/internal event will wake up us.
				erljs_scheduler_log("Ended consuming (nothing to consume anyway). Waiting for rentry on event.");
				return;
			}
		}

		end = (new Date()).getTime();
	} while (
		reductions < max_reductions
		&&
		(end - start) < max_time
	);

	erljs_scheduler_log("Ended consuming (too many consumption: red="+reductions+", time="+(end-start)+"ms). Doing quick rentry using incremental timeout, or event.");

	erljs_timeout_timer_id = window.setTimeout(erljs_scheduler_continue_increment, erljs_timeout_timer_timeout);
}


/** As of window.setTimeout usage, the env.js have implemented them, so we can use it
 *
 * Pure Rhino based approach is using:
 *  java.lang.Thread.sleep(int) , spawn(Function) and sync(Function)
 */
