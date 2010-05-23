/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

function toJSON(x) {
	if (Object.toJSON) {
		return Object.toJSON(x);
	} else {
		if (x instanceof ETerm
			 || x instanceof String
			|| x instanceof Number) {
			return x.toString();
		}
		var r = "\n";
		for (var i in x) {
			r += "\t"+i+": "+x[i] +"\n";
		}
		return r;
	}
}

function ss(XX) {
	return (XX ? toJSON(XX) : "undefined");
}

function debugh(X) {
	try { // block for webbrower, but try for Rhino
		var r = document.createElement("div");
		r.innerHTML = X;
		var d = document.getElementById("debugdiv");
		d.appendChild(r);
		d.scrollTop = d.scrollHeight;
	} catch (e) {
		try { // Rhino
			print(X);
		} catch (e2) { };
	};
}
function debug(X) {
	try { // block for webbrower, but try for Rhino
		var r = document.createElement("div");
		r.innerText = X;
		document.getElementById("debugdiv").appendChild(r);

		//document.getElementById("debugform"). += X;
		//document.getElementById("debugform").innerText += "\n\r";
	} catch (e) {
		try { // Rhino
			print(X);
		} catch (e2) { };
	};
}

// assert test, for internal error, or situation which should never occur in proper bytecode.
function assert(cond) {
	if (!cond) {
		alert("assertion failed, breaking.");
		throw "assertion failed";
	}
}

/** Tests if given OpCode is Name/Arity. */
function opcode_test(OC, Name, Arity) {
	return true;
/*
	if (Arity == 0) {
		return OC == Name;
	} else {
		if (OC[0] == Name) {
			assert(OC.length == Arity+1);
			return true;
		}
	}
*/
}

/** Returns String representing function unicly (ie. mod:name/5) */
function func_sig(ModuleName, Name, Arity) {
	return ModuleName+":"+Name+"/"+Arity;
}

var opcode_profiler = {};


function uns(OC) {
	throw "not yet supported opcode "+toJSON(OC);
}

function get_opcode(O) {
	return (typeof(O) == "string" ? O : O[0]); // to accomodate "return", and another 0-length OC
}

var erljs_vm_initalized = false;
var Labels = {};
var FunctionsCode = {};

function erljs_vm_init(Modules) {
	if (erljs_vm_initalized) {
		return true;
	}
	erljs_vm_initalized = true;
	var start = (new Date).getTime(), diff = 0;

	// convert Modules which contains all modules to internal format
	// registers all functions, and labels.  (can there be jumps to labels outside of the function to the function in the same modules? (It can be, as sometimes compiler do strange things).
	for (var i = 0; i < Modules.length; i++) {
		var ModuleName = Modules[i][0];
		var Module = Modules[i][1];
		Labels[ModuleName] = {};
		for (var j = 0; j < Module.length; j++) {
			var FunctionCode = Module[j];
			//["function","ntka",2,6,[
			//    ["label",5],
			//    ["func_info",["atom","example"],["atom","ntka"],2],
			//    ["label",6],
			if (FunctionCode[0] == "function") {
				var Name = FunctionCode[1];
				var Arity = FunctionCode[2];
				//debug(Name+"/"+Arity);
				var EntryPoint = FunctionCode[3];
				var Code = FunctionCode[4];
				var FunctionSignature = func_sig(ModuleName, Name, Arity);
				var NewCode = new Array();
				var l = 0;
				for (var k = 0; k < Code.length; k++) {
					var OC = Code[k];
					//debug(ss(OC));
					var opcode0 = get_opcode(OC);
					if (opcode0 == "label" || opcode0 == "l") {
						//opcode_test(OC, 'label', 1)
						//console.log("dodaje label " + OC[1] + "(z pozycji org "+k+") na pozycji "+l+ " w funkcji "+ FunctionSignature);
						Labels[ModuleName][OC[1]] = [FunctionSignature, l];
					} else {
						
						switch(opcode0) {
							case "allocate":
							case "allocate_zero":
							case "allocate_heap":
							case "deallocate":
							case "test_heap":
							//case "trim": // what is trim?
								break;
							default:
								if (typeof(OC) == "string") {
									NewCode[l++] = new Array(OC);
								} else {
									NewCode[l++] = OC;
								}
								break;
						}
					}
				}
				FunctionsCode[FunctionSignature] = NewCode;
			} else {
				alert("not a function at position " + j + " of module "+ModuleName);
			}
		}
	}
	diff = (new Date).getTime() - start;
	debug("vm initialized in "+diff+"ms.");
}

function is_list(E) {
	//return E instanceof ETerm && E.is("list");
	//return E instanceof EList || E instanceof EListNil || E instanceof EListString;
	return E instanceof EListAny;
}
function is_atom(E) {
	return E instanceof EAtom;
}
function is_tuple(E) {
	return E instanceof ETuple;
}
function is_integer(E) {
	return (typeof(E) == "number") || ((typeof(E) == "object") && !isNaN(E))
		|| (E instanceof EInteger);
}
function is_float(E) {
	return false;
}
function is_binary(E) {
	return false;
}
function is_boolean(E) {
	return is_atom(E) && (E.atom_name()=="true" || E.atom_name()=="false");
}
// this will also return false if E is not atom, or not false at all.
function is_true(E) {
	return is_atom(E) && (E.atom_name()=="true");
}
function is_ref(E) {
	return E instanceof ERef;
}
function is_pid(E) {
	return E instanceof EPid;
}

function erljs_eq(A,B,strict) {
erljs_eq_loop:
while(true) {
	if (typeof A == typeof B) {
		if (A === B) { return true; } // equal references
		switch (typeof(A)) {
			case "object":
				if (!(A instanceof ETerm && B instanceof ETerm)) {
					throw "not implemeneted erljs_eq for object other thatn ETerm";
				}
				if (A.type() != B.type()) {
					return false;
				}
				switch (A.type()) {
					case "list":
						// TODO: handle EListString more effectivelly
						if (A.empty() && B.empty()) {
							return true;
						}
						if (A.empty() || B.empty()) {
							return false;
						}
						// TODO: make this tail recursive
						if (!erljs_eq(A.head(), B.head(), strict)) {
							return false;
						}
						A = A.tail();
						B = B.tail();
						continue;
					case "tuple":
						var ata=A.tuple_arity();
						if (ata != B.tuple_arity()) {
							return false;
						}
						for (var i = 0; i < ata; i++) {
							if (!erljs_eq(A.get(i), B.get(i), strict)) {
								return false;
							}
						}
						return true;
					case "atom":
						if (A.atom_id() == B.atom_id()) {
							return true;
						} else {
							return false;
						}
					case "integer":
					case "float":
// same as bellow
		if (is_integer(A) && is_integer(B)) {
			return (A==B);
		}
		if (is_float(A) && is_float(B)) {
			return (A==B);
		}
		if ((is_integer(A) && is_float(B)) || (is_float(A) && is_integer(B))) {
			if (strict) {
				return false;
			} else {
				return (A==B);
			}
		}
		return false;
//
					default:
						throw "something missing in implementation f erljs_eq.";
				}
				break;
			case "number":
				return (A==B);
			default:
				throw "not implemeneted erljs_eq for "+(typeof(A));
		}
	} else {
		if (is_integer(A) && is_integer(B)) {
			return (A==B);
		}
		if (is_float(A) && is_float(B)) {
			return (A==B);
		}
		if ((is_integer(A) && is_float(B)) || (is_float(A) && is_integer(B))) {
			if (strict) {
				return false;
			} else {
				return (A==B);
			}
		}
		return false;
	}
}
}

// order: (Integer|Float) < Atom < Ref < Pid < Tuple < Nil < List

function term_order(A) {
	switch (typeof(A)) {
	case "number":
		return 1;
	//case "string":
	case "object":
		if (A instanceof ETerm) {
			switch (A.type()) {
				case "integer":
				case "float":
					return 1;
				case "atom":
					return 2;
				case "ref":
					return 3;
				case "pid":
					return 4;
				case "tuple":
					return 5;
				case "list":
					return 6;
				default:
					throw "term order 3";
			}
		} else if (A instanceof Number) {
			return 1;
		} else {
			throw "term order error 2";
		}
	default:
		throw "term order error 1";
	}
}


function comparator(type) {
	switch (type) {
	case "lt":
		return function (a,b) { return a < b; };
	case "ge":
		return function (a,b) { return a >= b; };
	default:
		throw "error";
	}
}

function erljs_cmp(A,B,cmp) {
erljs_cmp_loop:
while(true) {
	var oA = term_order(A);
	var oB = term_order(B);
	if (oA != oB) {
		return cmp(oA,oB);
	}
	// A and B are of the same type now, decompose recursivly
	switch (oA) {
	case 1: // integer or float of some kind
		// natural ordering
		return cmp(A, B);
	case 2: // atom
		// lexicographical ordering of text representation
		return cmp(A.atom_name(), B.atom_name());
	case 3: // ref
		// any consitent ordering
		throw "ref comparission not implemented yet";
	case 4: // pid
		// any consitent ordering
		throw "pid comparission not implemented yet";
	case 5: // tuple
		// shorter tuples first, content doesn't matter
		// {} < {d} < {c,b} < {a,a,a}
		// if equal length, then lexicographical from element 1
		// {a,a,a} < {a,b,c} < {z,z,z}
		var aA = A.tuple_arity();
		var aB = B.tuple_arity();
		if (aA != aB) {
			return (aA < aB ? -1 : +1);
		}
		// same arity
		for (var i = 0; i < aA; i++) {
			var c = erljs_cmp(A.get(i), B.get(i), cmp);
			if (c != 0) { return c; }
		}
		return 0;
	case 6: // list
		// [] < [a] < [a,a] < [a,b] < [a,c] < [a,d,a]
		//    [] < [a|[]] < [a|[a|[]]] < [a|[b|[]]] < [a|[c|[]]] < [a|[d|[a|[]]]]
		// but [a,a,a] < [a,c] !
		//    but [a|[a|[a|[]]]] < [a|[c|[]]] !
		// [] < [a|b] < [a] < [b]
		//    [a|[]] < [a,b] === [] < [b].
		// so just keep comparing heads, if they are equal continue,
		// in some point we will compare Nil or inproper tail element with second part.

		if (A instanceof EListNil) {
			if (B instanceof EListNil) {
				return 0;
			} else {
				return -1;
			}
		} else {
			if (B instanceof EListNil) {
				return +1;
			} else {
				var c = erljs_cmp(A.head(), B.head(), cmp);
				if (c != 0) { return c; }
				A = A.tail();
				B = B.tail();
				continue erljs_cmp_loop; // tail recursion
			}
		}
		// TODO: special case of EListString
	default:
		throw "m";
	}
}
}

// A < B
function erljs_lt(A,B) {
	return erljs_cmp(A,B,comparator("lt"));
}

// A >= B
function erljs_ge(A,B) {
	return erljs_cmp(A,B,comparator("ge"));
}



var AllReductions = 0;
var NativeReductions = 0;

function erljs_vm_call_(Modules, StartFunctionSignature0, Args, MaxReductions, FullDebug) {
//	var Heap = [];
	var Stack = [];
	var Reg0 = 0; // x(0)
	var Regs = []; // x(1), ... x(N)
	var FloatRegs = []; // floating point
	var Self = new EPid();
	var Node = 0;
	var IP = 0; // pointer in current node
	var Reductions = 0;
	var LocalRegs = []; // unify Regs and LocalRegs into [2] array, and choose from them using 0 or 1 pointer.
	var LocalEH = []; // local exception handlers (in this function)

//	var FunctionsCode = {};
//	var Labels = {};

	var ThisFunctionCode = [];
	var FloatError = false;

	erljs_vm_init(Modules);

	// start execution point
	var StartFunctionSignature = func_sig(StartFunctionSignature0[0], StartFunctionSignature0[1], StartFunctionSignature0[2]);

	// insert initial parameters of first function
	for (i = 0; i < Args.length; i++) {
		Regs[i] = Args[i];
	}

	var ThisModuleName = StartFunctionSignature0[0];
	var ThisFunctionSignature = StartFunctionSignature;

	switch (ThisModuleName) {
	case "math":
	case "erljs":
	// even if allowed in some point, problem with erlang:* is that some functions are 'bif' and some are called using 'special opcodes' and some using 'call_ext*'
	case "erlang":
		throw "module "+ThisModuleName+" not allowed in direct calls yet.";
	}
	var ThisLabels = Labels[ThisModuleName];

	var ThisFunctionCode = FunctionsCode[ThisFunctionSignature];

	if (ThisFunctionCode === undefined) {
		throw "no such function: " + ThisFunctionSignature;
	}

	var last_reason = "noreason";

	var GeneralEntryPoint = 1; // 2 with labels.

	IP = GeneralEntryPoint;

	function get_arg(What) {
		if (What == "nil") return new EListNil(); // we can return static Nil reference really.
		switch (What[0]) {
			case "x": // {x,N} is in register
				return Regs[What[1]];
			case "y": // {y,N} is in local register
				return LocalRegs[What[1]];
			case "integer": // {integer,N} is literal integer
				return What[1];
			case "atom": // {atom,N} is literal atom
				return new EAtom(What[1]);
			case "float":  // {float,N} is literal float
				return What[1];
			case "fr": // {fr,N} is in float register
				return FloatRegs[What[1]];
			case "literal": // {litera,Term} is some kind of complex (compile time constant) term in. [a,b,c]
				return eterm_decode(What[1]);
			default:
				throw("what? "+ss(What));
		}
	}

	function jump(LabelNo) {
		var L = ThisLabels[LabelNo];
		//var L = Labels[ThisModuleName][LabelNo];
		IP = L[1];
	}
	function jumpf(LabelF) {
		//assert(LabelF.length == 2);
		//assert(LabelF[0] == "f");
		last_reason = "noreason";
		assert(LabelF[1] != 0);
		jump(LabelF[1]);
	}
	function jumpfr(LabelF,Reason) {
		//assert(LabelF.length == 2);
		//assert(LabelF[0] == "f");
		last_reason = Reason;
if (LabelF[1] === 0) {
		// special case in which we should throw error because of some invalide operation, like badarith.
		//it should look like this:
		erl_throw(eterm_decode("{'EXIT',{"+Reason+",[]}}"));
/*
		{'EXIT',{badarith,[
					{erlang,'+',[1,a]},
					F1.  // {M,F,A}
					F2,  // {M,F,A}
					F3   // {M,F,A}
				]}}
*/
	throw "we do not support implicit exceptions yet";
} else {
		jump(LabelF[1]);
}
	}

	// erlang:put/get
	var PDict = {}; // process dictionary

	// bif put/put_tuple
	var put_tuple_register = -1, put_tuple_i = -1;

	// tracing
	var TracedModules = {};
	//TracedModules["example"]=1;
	//TracedModules["tests_auto"]=1;
	//TracedModules["random"]=1;
	//TracedModules["lists"]=1;

	var Etrue = new EAtom("true"),
		Efalse = new EAtom("false");

	// current opcode
	var OC = [];

	function vm_assert(cond, msg) {
		if (!cond) {
			alert("vm assertion failed, breaking.  OC="+toJSON(OC) + "  msg="+msg);
			throw "vm assertion failed";
		}
	}
	var assert = vm_assert;

	NativeReductions = 0;

	function erl_throw(E) {
		// {'EXIT',{E,[{M,F,A},{M,F,A},...]}}.
		// now we need to traverse stack, up to the proper EH handler
		// we can ignore stack trace for now
		var X;
		while (LocalEH[0] === undefined) {
			X = Stack.pop();
			if (X === undefined) { throw E; }
			LocalEH = X[5];
			NativeReductions++;
		}
		if (X === undefined) {
			throw E;
		}
// part of return opcode
		ThisFunctionSignature = X[0];
		ThisFunctionCode = X[1];
		//IP = X[2];
		ThisModuleName = X[3];
		LocalRegs = X[4];
		//LocalEH = X[5];
		ThisLabels = Labels[ThisModuleName];

		LocalRegs[LocalEH[0][0]] = E;
		var L = ThisLabels[LocalEH[0][1]];
		IP = L[1];
		assert(L[0] == ThisFunctionSignature);
	}

	// execution loop
	// TODO: optimalise it by:
	//    using smaller number of variables,
	//    create intermidiate (static) form which is
	//      better suited for it and more compact
	// Note: keep all identifiers (function names and variables) disriptive.
	// They will be compressed automatically using compressor.
	// TODO: preallocate some atomes: "true","false","undefined" and use the same ref everytime (saves time, memory, and space in code source)
try {

mainloop:
	while (true) {

	OC = ThisFunctionCode[IP];

	if (OC === undefined) {
		throw "internal_vm_error: No return at the end of function. Terminating.";
	}

	if (ThisModuleName in TracedModules) {
	if (FullDebug >= 1) {
		if (FullDebug >= 1) {
			try {
				debug("  x0: "+ss(Regs[0]));
				debug("  x1: "+ss(Regs[1]));
				debug("  x2: "+ss(Regs[2]));
				debug("  x3: "+ss(Regs[3]));
				debug("  x4: "+ss(Regs[4]));
				debug("  y0: "+ss(LocalRegs[0]));
				debug("  y1: "+ss(LocalRegs[1]));
			} catch (err) { debug("  not displaying registers -- too long values or tuple construction"); }
		}
		debug("Function: "+ThisFunctionSignature+"  IP: " + IP + "  (Reduction counter: "+Reductions+", Native reduction counter: "+NativeReductions+").");
		debug("Instruction: "+toJSON(OC));
	}
	}

	IP++;

	Reductions++;

	if (FullDebug > 2) {
		document.getElementById("Red").value = Reductions;
	}
	if (FullDebug > 3) {
		document.getElementById("X0").value = toJSON(Regs[0]);
		document.getElementById("X1").value = toJSON(Regs[1]);
		document.getElementById("X2").value = toJSON(Regs[2]);
	}

	AllReductions = Reductions + NativeReductions;

	if (AllReductions > MaxReductions) {
		throw "too_many_reduction";
	}

	var opcode0 = OC[0];

	if (opcode_profiler[opcode0]) {
		opcode_profiler[opcode0]++;
	} else {
		opcode_profiler[opcode0]=1;
	}

	if (ThisModuleName in TracedModules) {
	if (FullDebug>1) {
		debug("profile: "+toJSON(opcode_profiler));
	}
	}

	if (ThisModuleName in TracedModules) {
	if (FullDebug) {
		debug("-----");
	}
	}

// in opera i see drastic speed loss when added about 50 sporious cases at he beggining of the switch.
// this mean it isn't O(1), and for this reason I have most important opcodes at the top.

	switch (opcode0) {

	case "t":
	//case "test":
		//opcode_test(OC, 'test', 3);
			//assert(OC[2].length == 2);
			//assert(OC[2][0] == "f");
			switch (OC[1]) {
			case "is_tuple":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!is_tuple(Arg)) {
					jumpf(OC[2]);
				}
				break;
			case "test_arity":
				//assert(OC[3].length == 2);
				var Arg = get_arg(OC[3][0]);
				if (!(is_tuple(Arg) && Arg.tuple_arity() == OC[3][1])) {
					jumpf(OC[2]);
				}
				break;
			case "is_integer":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!is_integer(Arg)) {
					jumpf(OC[2]);
				}
				break;
			case "is_float":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!is_float(Arg)) {
					jumpf(OC[2]);
				}
				break;
			case "is_atom":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!is_atom(Arg)) {
					jumpf(OC[2]);
				}
				break;
			case "is_eq_exact":
				//assert(OC[3].length == 2);
				if (!erljs_eq(get_arg(OC[3][0]), get_arg(OC[3][1]), true)) {
					jumpf(OC[2]);
				}
				break;
			case "is_eq":
				//assert(OC[3].length == 2);
				if (!erljs_eq(get_arg(OC[3][0]), get_arg(OC[3][1]), false)) {
					jumpf(OC[2]);
				}
				break;
			case "is_ne_exact":
				//assert(OC[3].length == 2);
				if (erljs_eq(get_arg(OC[3][0]), get_arg(OC[3][1]), true)) {
					jumpf(OC[2]);
				}
				break;
			case "is_lt": // this tests should be performd using correct ordering from Erlang
				//assert(OC[3].length == 2);
				if (!erljs_lt(get_arg(OC[3][0]), get_arg(OC[3][1]))) {
					jumpf(OC[2]);
				}
				break;
			case "is_ge": // yes there is only < and >= opcode in VM. 
				//assert(OC[3].length == 2);
				if (!erljs_ge(get_arg(OC[3][0]), get_arg(OC[3][1]))) {
					jumpf(OC[2]);
				}
				break;
			case "is_list":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!is_list(Arg)) {
					jumpf(OC[2]);
				}
				break;
			case "is_nonempty_list":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				//if (!(Arg instanceof EList || Arg instanceof EListString)) {
				if (!(Arg instanceof EListNonEmpty)) {
					jumpf(OC[2]);
				}
				break;
			case "is_nil":
				//assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!(Arg instanceof EListNil)) {
					jumpf(OC[2]);
				}
				break;
			case "is_function2":
				var Arg1 = get_arg(OC[3][0]);
				var Arg2 = get_arg(OC[3][1]);
				if (!(Arg1 instanceof EFun && Arg1.fun_arity() === Arg2)) {
					jumpf(OC[2]);
				}
				break;
			default:
				uns(OC);
			}
			break;
	case "m":
	//case "move":
		//opcode_test(OC, 'move', 2);
			var SrcArg = get_arg(OC[1]);
			//assert(OC[2].length == 2);
			var DstRegNo = OC[2][1];
			if (OC[2][0] == "x") {
				Regs[DstRegNo] = SrcArg;
			} else if (OC[2][0] == "y") {
				LocalRegs[DstRegNo] = SrcArg;
			} else {
				uns(OC);
			}
			break;
	case "G":
	//case "gc_bif":
		//opcode_test(OC, 'gc_bif', 5);
			// OC[3]? // it looks it is is mostly number of args: assert(OC[3] == OC[4].length == 2); // but sometimes it is 3.
			//assert(OC[5].length == 2);
			//assert(OC[5][0] == "x");
			var DstRegNo = OC[5][1];
			var Arg1 = get_arg(OC[4][0]);
			var V;
			if (OC[4].length == 2
//					&& (OC[1] == "*" || OC[1] == "+" || OC[1] == "-"
//					|| OC[1] == "div" || OC[1] == "rem"
//					|| OC[1] == "bor" || OC[1] == "band" || OC[1] == "bxor" || OC[1] == "bsr" || OC[1] == "bsl")
			) {
				var Arg2 = get_arg(OC[4][1]);
				if (!(is_integer(Arg1) && is_integer(Arg2))) {
					jumpfr(OC[2],"badarith");
				} else {
					//var Arg1b = new BigInteger(Arg1);
					//var Arg2b = new BigInteger(Arg2);
					switch (OC[1]) {
					case "*":
						V = Arg1*Arg2;
						//V = Arg1b.multiply(Arg2b);
						break;
					case "+":
						V = Arg1+Arg2;
						//V = Arg1b.add(Arg2b);
						break;
					case "-":
						V = Arg1-Arg2;
						//V = Arg1b.sub(Arg2b);
						break;
					case "bor":
						V = Arg1 | Arg2;
						break;
					case "band":
						V = Arg1 & Arg2;
						break;
					case "bxor":
						V = Arg1 ^ Arg2;
						break;
					// Note: (N bsl X) bsr X is identity function for any N and X>0.
					case "bsl":
						// example: -33 bsl 4 = -528. 33 bsl 4 = 528. 33 bsl -4 = 2. -33 bsl -4 = -3.
						V = Arg1 << Arg2;
						break;
					case "bsr":
						// example: -33 bsr 4 = -3. -33 bsr -1 = -66. 33 bsr 1 = 16. 33 bsr -1 = 66.
						V = Arg1 >> Arg2;
						break;
					case "div":
						// TODO: merge div and rem cases, becuase in case of bignum's both are computed in the same time. also Arg2==0 check is the same.
						if (Arg2 == 0) {
							throw "badarith";
						}
						// example: 3 div 4 = 0. 5 div 4 = 1. -3 div 4 = 0. -5 div 4 = -1. 5 div -4 = -1. 5 div -6 = 0. -5 div -4 = 1. -5 div -6 = 0.
						V = Math.round(Arg1/Arg2);
						break;
					case "rem":
						if (Arg2 == 0) {
							throw "badarith";
						};
						// Arg2 and -Arg2 gives same Result.  -Arg1 gives -Result
						V = Arg1 % Arg2;
						break;
					default:
						uns("OC");
					}
				}
			} else if (OC[4].length == 1) {
				switch (OC[1]) {
				case "-":
				case "bnot":
					if (!is_integer(Arg1)) {
						jumpfr(OC[2],"badarith");
					} else {
						switch (OC[1]) {
						case "-":
							V = - Arg1;
							break;
						case "bnot":
							V = ~ Arg1;
							break;
						default:
							assert(false);
						}
					}
					break;
				case "length":
					if (!is_list(Arg1)) {
						jumpfr(OC[2],"badarg");
					} else {
						try {
							var l = list_len(Arg1);
							NativeReductions += l;
							V = l;
						} catch (err) {
							throw "badarg"; // Arg must be proper list
						}
					}
					break;
				case "size":
					if (is_tuple(Arg1)) {
						V = Arg1.tuple_arity();
					} else if (is_binary(Arg1)) {
						V = Arg1.size();
					} else {
						jumpfr(OC[2],"badarg");
					}
					break;
				case "abs":
					if (!is_integer(Arg1) && !is_float(Arg1)) {
						jumpfr(OC[2],"badarg");
					} else {
						V = Math.abs(Arg1);
					}
					break;
				case "trunc":
					if (!is_integer(Arg1) && !is_float(Arg1)) {
						jumpfr(OC[2],"badarg");
					} else {
						// trunc(-1.9) = -1. trunc(1.9) = 1.
						if (Arg1 > 0) {
							V = Math.round(Arg1-0.5);
						} else {
							V = Math.round(Arg1+0.5);
						}
					}
					break;
				default:
					uns(OC);
				}
			} else {
				uns(OC);
			}
			if (V!==undefined) { // do not set it on jumpf
				if (OC[5][0] == "x") {
					Regs[DstRegNo] = V;
				} else if (OC[5][0] == "y") {
					// yes, possible (found in some list comprehensions.,
					// and it looks they are not tail reursive,
					// but doesn.t need to reverse list then.)
					LocalRegs[DstRegNo] = V;
				} else {
					uns(OC);
				}
				break;
			}
			break;

	// calls in the same module
	case "c": //alias for "call_only", mostly for tight iterative style loops in the same module.
	//case "call_only":
	case "C": // alias for "call"
	//case "call":
		//opcode_test(OC, 'call', 2) || opcode_test(OC, 'call_only', 2);
			switch (opcode0) {
			case "C":
			//case "call":
				Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs, LocalEH]);
				LocalRegs = [];
			default: // fall-throught
				LocalEH = [];
				assert(OC[2].length == 3);
				var ModuleName = OC[2][0];
				var Name = OC[2][1];
				var Arity = OC[2][2];
				//assert(OC[1] == Arity);
				var FunctionSignature = func_sig(ModuleName, Name, Arity);
				// TODO: read the same version of module, not newset one
				ThisFunctionCode = FunctionsCode[FunctionSignature];
				if (ThisFunctionCode === undefined) {
					erl_throw(new EAtom("undef"));
				} else {
					ThisFunctionSignature = FunctionSignature;
					//ThisModuleName = ModuleName;
					//ThisLabels = Labels[ThisModuleName];
					//jump(EntryPoint);
					IP = GeneralEntryPoint;
				}
			}
			break;

/*
		M:funkcja(a)  -> [apply_last,1,0]
		apply(M, funkcja, [a]) -> [apply_last,1,0]

		{M:funkcja(a)}  -> [apply,1]
		{apply(M, funkcja, [a])} -> [apply,1]


			Arity = OC[1];
			//Args0 = Regs[0]; // do not need to move, just find M:F/A and jump.
			Module = Regs[1].toString();
			FunctionName = Regs[2].toString();
			// in apply_last additionally OC[2]=0 ?

		apply(M,funkcja, X) -> call_ext_only erlang:apply/3
		{apply(E, lists, X)}. -> call_ext erlang:apply/3

		apply(F,[a,5]) -> call_ext_only erlang:apply/2
		apply(F,X) -> call_ext_only erlang:apply/2

		{apply(F,[a,5])} -> call_ext erlang:apply/2
		{apply(F,X)} -> call_ext erlang:apply/2

		F(X) -> [call_fun,1]
			args = Regs[0...arity-1]. Regs[arity] = F.
			// BUG: funs are not called tail-recursivelly!
			// tested compiler with +'S' option also doesn't produce
			// tail optimal code:
			    {call_fun,2}.
			    {deallocate,2}.
			    return.
			// but it doesn't eat memoery!

*/

	case "apply_last": // to robi compilator jesli zna ilosc argumentow za wczasu.
	case "apply":
			uns(OC);
			break;

	case "call_fun":
			opcode_test(OC, 'call_fun', 1);
			var Arity = OC[1];
			var Fun = Regs[Arity];
			if (!(Fun instanceof EFun)) {
				erl_throw(new ETuple([new EAtom("badfun"), Fun]));
			} else if (Fun.fun_arity() != Arity) {
				var ListArgs = new EListNil();
				for (var i = Arity-1; i >= 0; i--) {
					ListArgs = new EList(Regs[i], ListArgs);
				}
				erl_throw(new ETuple([
						new EAtom("badarity"),
						new ETuple([Fun, ListArgs])
				]));
			} else {
				Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs, LocalEH]);
				LocalRegs = [];
				LocalEH = [];

				for (var i = 0; i < Arity; i++) {
					assert(Regs[i] !== undefined);
				}

				var FunctionModuleName = Fun.function_modulename();
				var FunctionName = Fun.function_name();
				var FunctionArity = Fun.function_arity();

				if (Fun instanceof EFunLocal) {
					for (var i = Arity, j = 0; i < FunctionArity; i++, j++) {
						assert(Fun.Env[j] !== undefined);
						Regs[i] = Fun.Env[j];
					}
				}

				var FunctionSignature = func_sig(FunctionModuleName, FunctionName, FunctionArity);
				// if no such function?
				ThisFunctionCode = FunctionsCode[FunctionSignature];
				if (ThisFunctionCode === undefined) {
					erl_throw(new EAtom("undef"));
				} else {
					ThisFunctionSignature = FunctionSignature;
					ThisModuleName = ModuleName;
					ThisLabels = Labels[ThisModuleName];
					//jump(EntryPoint);
					IP = GeneralEntryPoint;
				}
			}
			break;

	// calls to external modules
	case "call_lists":
	case "call_ext":
	case "call_ext_only":
	case "call_lists_only":
	case "call_ext_last":
	case "call_last":
			last_reason = "";
			var native_function = false; // 'native' keyword is reserved in the Rhino JS :(
		//opcode_test(OC, 'call_ext', 2) || opcode_test(OC, 'call_ext_only', 2) || opcode_test(OC, 'call_lists', 2) || opcode_test(OC, 'call_lists_only', 2);
		//opcode_test(OC, 'call_ext_last', 3/4 ?); // ? last parameters is integer, i.e. 1
		//opcode_test(OC, 'call_last', 3);

			var ModuleName, Name, Arity;
			//debug("call OC+"+toJSON(OC));
			if (opcode0=="call_ext_last") {
				assert(OC[2].length == 4);
				ModuleName = OC[2][1];
				Name = OC[2][2];
				Arity = OC[2][3];
			} else if (/_last$/.test(opcode0)) {
				assert(OC[2].length == 3);
				ModuleName = OC[2][0];
				Name = OC[2][1];
				Arity = OC[2][2];
			} else {
				assert(OC[2].length == 4);
				ModuleName = OC[2][1]; // todo: this can be parametrized module!
				Name = OC[2][2];
				Arity = OC[2][3];
			}
			//debug("INS: "+toJSON(OC)+" "+ModuleName+" "+Name+" "+Arity);
			function ni(OC) { debug("not imlepmented: "+ModuleName+":"+Name+"/"+Arity); uns(OC); throw "stoped execution"; }
			// TODO: prepare hash table for this.
			if (ModuleName == "erljs") {
				var NA = Name+"/"+Arity;
				switch (NA) {
				case "eval/1":
					var k = Regs[0].toString();
					var T = eval(k); // first one can be changed to fromJSON
					T = eval(T);
					if (T!==undefined) Regs[0] = T; else Regs[0] = 0;
					break;
				case "alert/1":
					var k = Regs[0].toString();
					alert(k);
					Regs[0] = 0;
					break;
				case "console_log/1":
					Regs[0] = 0;
					console.log(Regs[0]);
					break;
				default:
					alert("erljs "+NA+" undef");
					throw "undef";
				}
				native_function=true;
			} else if (ModuleName == "math") {
				var NA = Name+"/"+Arity;
				switch (NA) {
				case "pi/0":
					Regs[0] = Math.PI;
					break;
				case "exp/1":
				case "log/1":
				case "sqrt/1":
				case "sin/1": // triconometric functions
				case "cos/1":
				case "tan/1":
				case "asin/1":
				case "acos/1":
				case "atan/1":
					eval("Regs[0] = Math."+Name+"(Regs[0]);");
					break;
				case "log10/1":
					Regs[0] = Math.log(Regs[0])/Math.LN10;
					break;
				case "sinh/1": // TODO: hiperbolic functions
				case "cosh/1":
				case "tanh/1":
				case "asinh/1":
				case "acosh/1":
				case "atanh/1":
					uns(OC);
					break;
				case "atan2/2":
				case "pow/2":
					eval("Regs[0] = Math."+Name+"(Regs[0],Regs[1]);");
					break;
				case "erf/1": // Note: also not available in Erlang on Windows.
				case "erfc/1":
					uns(OC);
					break;
				default: throw "nofunc";
				}
				native_function=true;
			} else if (ModuleName == "erlang") {
				var NA = Name+"/"+Arity;

				switch (NA) {
				//case "length/1": // in gc_bif
				//	break;

				case "++/2": // concats two lists. left cannot be improper
					if (!(is_list(Regs[0]) && is_list(Regs[1]))) throw "badarg";
					if (!Regs[1].empty()) {
						if (!Regs[0].empty()) {
							// TODO: add optimalisation for case when Regs[0] is EListString
							var temp0 = new EList(-137,-138);
							var temp = temp0;
							while (Regs[0] instanceof EListNonEmpty) {
								temp.sethead(Regs[0].head());
								var temp2 = new EList(-139,-142)
								temp.settail(temp2);
								temp = temp2;
								Regs[0] = Regs[0].tail();
								NativeReductions++;
							}
							if (!(Regs[0] instanceof EListNil)) throw "badarg"; // Regs[0] must be proper list.
							temp.sethead(Regs[1].head());
							temp.settail(Regs[1].tail());
							Regs[0] = temp0;
						} else {
							Regs[0] = Regs[1];
						}
					}
					break;
				case "--/2":
					ni(OC); break;
				case "apply/2": // apply(Fun,[a,b,c])
					// same as {M,F,Binded}=Fun, apply(M,F,Binded++[a,b,c]). ?
					ni(OC);
					break;
				case "apply/3": // apply(M,F,[a,b,c]) // be sure to make it tail-recursive!
					if (!(is_atom(Regs[0]) && is_atom(Regs[1]) && is_list(Regs[2]))) {
						throw "badarg";
					}
					ModuleName = Regs[0].toString; // atom // warning this can be erlang or erljs!
					Name = Regs[1].toString; // atom
					Arity = Regs[2].length();
					//LocalRegs2 = Regs[0 .. Arity];
					//Regs[0] <- Regs[2].hd();
					//Regs[1] <- Regs[2].tl().hd();...
					ni(OC);
					break;
/*				case "hd/1": // in bif
					if (!(Regs[0] instanceof EList)) throw "badarg";
					Regs[0]=Regs[0].head();
					break;
				case "tl/1": // in bif
					if (!(Regs[0] instanceof EList)) throw "badarg";
					Regs[0]=Regs[0].tail();
					break;
*/
				//case "size/1": ni(OC); break; // for tuples or binaries // in gc_bif
				//	Regs[0] = Regs[0].tuple_arity();


				case "atom_to_list/1":
					if (!is_atom(Regs[0])) {
						throw "badarg";
					}
					var AtomName = Regs[0].atom_name();
					if (AtomName.length > 0) {
						Regs[0] = new EListString(AtomName);
					} else {
						Regs[0] = new EListNil();
					}
					break;

				case "list_to_atom/1":
				case "list_to_existing_atom/1": // fallthrough
					if (!is_list(Regs[0])) {
						throw "badarg";
					}
					var s = Regs[0].toByteList();
					if (s === null) {
						// list contains out-of-0-255-range integers, or other types
						throw "badarg";
					}
					// TODO: for _existing_ variant, check if it already exist.
					Regs[0] = new EAtom(s);
					break;

				case "list_to_integer/1": ni(OC); break;
				case "integer_to_list/1":
					var L = Math.round(Math.abs(Regs[0]));
					if (L) {
						var Li = new EListNil();
						while (L) {
							var Rest = L%10;
							Li = new EList(48+Rest,Li); // 48=$0.
							L = (L-Rest)/10;
							NativeReductions++;
						}
						if (Regs[0] < 0) Li = new EList(45,Li); // 45=$-.
						Regs[0] = Li;
					} else {
						Regs[0] = new EList(48,new EListNil()); // [$0]
					}
					break;
				case "integer_to_list/2": ni(OC); break;
				case "list_to_float/1": ni(OC); break;
				case "float_to_list/1": ni(OC); break;

				case "list_to_tuple/1": ni(OC); break;
				case "tuple_to_list/1": ni(OC); break;
				case "append_element/2": ni(OC); break;

				case "make_fun/3":
					//erlang:make_fun(M, F, A) creates object (fun M:F/A)
					if(!(is_atom(Regs[0]) && is_atom(Regs[1]) && is_integer(Regs[2]) && Regs[2]>=0)) throw "badarg";
					// it is not needed to check if M:F/A function exists,
					// (it can be loaded or reloaded later), so check will be done at call time.

					Regs[0] = new EFunExternal(Regs[0], Regs[1], Regs[2]);
					break;

				case "put/2": // i.e. random:reseed
					var old = PDict[Regs[0].toString()];
					PDict[Regs[0].toString()] = [Regs[0],Regs[1]];
					Regs[0] = (old ? old : new EAtom("undefined"));
					break;
				case "erase/0":
				case "get/0":
					var t = new EListNil();
					for (var i in PDict) {
						t = new EList(new ETuple(r), t);
					}
					Regs[0] = t;
					if (Name=="erase") PDict={};
					break;
				case "erase/1":
				case "get/1":
					var r = PDict[Regs[0].toString()];
					Regs[0] = (r ? r[1] : new EAtom("undefined"));
					if (Name=="erase") PDict[Regs[0].toString()]=undefined; // or delete?
					break;
				case "get_keys/1": ni(OC); break;
				case "erase/0": ni(OC); break;
				case "erase/1": ni(OC); break;

				//case "abs/1": ni(OC); break; // abs value of float or int // in gc_bif
				case "min/2": ni(OC); break;
				case "max/2": ni(OC); break;
				case "make_ref/0": ni(OC); break;
				case "self/0": ni(OC); break;
				case "time/0": ni(OC); break; // {Hour,Minute,Second} // {9,42,44}
				case "date/0": ni(OC); break; // {Year,Month,Day}// {1996,11,6}
				case "localtime/0": ni(OC); break; // {{Year,Month,Day}, {Hour,Minute,Second}} // {{1996,11,6},{14,45,17}}
				case "fun_info/1": ni(OC); break;
				case "fun_info/2": ni(OC); break;
				case "phash/2": // i.e. sets:get_slot/2
					if (!is_integer(Regs[1])) { throw "badarg"; }
					Regs[0] = phash(Regs[0], Regs[1]);
					break;
				case "get_module_info/1": ni(OC); break;
				case "get_module_info/2": ni(OC); break;
				case "yield/0": continue mainloop; break; // ignore
				case "halt/0":
					alert("Halted:"+Regs[0]);
					return;
				case "halt/1":
					alert("Halted.");
					return;

				case "error/2":
					ni(OC);
				case "error/1":
					// call_ext
					var Arguments = new EListNil();
					var Reason = Regs[0];
					var StackTrace = new EList(
						new ETuple([]),
						new EListNil()
					);
					Reason = new ETuple([Reason, StackTrace]);
					erl_throw(new ETuple([new EAtom("EXIT"), Reason]));
					break;
				case "throw/1":
					// TODO: support for call_ext_last and call_ext
					erl_throw(Regs[0]);
					break;

				case "get_stacktrace/0":
					// [{Module, Function, Arity | Args}]
					ni(OC);
					break;

				default:
					throw "not implemented native function: "+ModuleName+":"+NA;
					break;
				}
				native_function=true;
			} else {
				// not needed currently as we have imlementation of this in lists*
				if (ModuleName == "lists" && Name == "reverse") {
					if (!is_list(Regs[0])) throw "badarg";
					switch (Arity) {
						case 1:
							//lists:reverse("123") = "321".
							Regs[1] = new EListNil();
						case 2: // fallthrough
							//lists:reverse("123","456") = "321456". left can't be inproper
							//lists:reverse([1,2,3,4],5)=[4,3,2,1|5].
							//lists:reverse([],5)=5.
							if (!Regs[0].empty()) {
								var temp = new EList(-137,Regs[1]);
								while (Regs[0] instanceof EListNonEmpty) {
									temp.sethead(Regs[0].head());
									temp = new EList(-139,temp)
									Regs[0] = Regs[0].tail();
									NativeReductions++;
								}
								if (!(Regs[0] instanceof EListNil)) throw "badarg"; // Regs[0] must be proper list.
								Regs[0] = temp.tail();
							} else {
								Regs[0] = Regs[1];
							}
							break;
					}
					native_function=true;
				} else {
					switch (opcode0) {
					case 'call_ext':
					case 'call_lists':
						Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs, LocalEH]);
						LocalRegs = [];
					default: // fallthrough
						LocalEH = [];
						var FunctionSignature = func_sig(ModuleName, Name, Arity);
						// if no such function?
						ThisFunctionCode = FunctionsCode[FunctionSignature];
						if (ThisFunctionCode == undefined) {
							erl_throw(new EAtom("undef"));
							break;
						} else {
							ThisFunctionSignature = FunctionSignature;
							ThisModuleName = ModuleName;
							ThisLabels = Labels[ThisModuleName];
							//jump(EntryPoint);
							IP = GeneralEntryPoint;
						}
					}
				}
			}
			if (native_function && /_(only|last)$/.test(opcode0)) {
	// same as in return
			Regs = [Regs[0]];
			if (Stack.length != 0) {
				var X = Stack.pop();
				ThisFunctionSignature = X[0];
				ThisFunctionCode = X[1];
				IP = X[2];
				ThisModuleName = X[3];
				LocalRegs = X[4];
				LocalEH = X[5];
				ThisLabels = Labels[ThisModuleName];
			} else {
				return Regs[0];
			}

			}
			break;
	case "r":
	//case "return":
		//opcode_test(OC, 'return', 0);
			Regs = [Regs[0]];
			if (Stack.length != 0) {
				var X = Stack.pop();
				ThisFunctionSignature = X[0];
				ThisFunctionCode = X[1];
				IP = X[2];
				ThisModuleName = X[3];
				LocalRegs = X[4];
				LocalEH = X[5];
				ThisLabels = Labels[ThisModuleName];
			} else {
				return Regs[0];
			}
			break;

	case "g":
	//case "get_list":
		//opcode_test(OC, 'get_list', 3);
			var Arg = get_arg(OC[1]);
			//assert(OC[2].length == 2);
			var Head_DstRegNo = OC[2][1];
			//assert(OC[3].length == 2);
			var Tail_DstRegNo = OC[3][1];
			switch (OC[2][0]) {
			case "x":
				Regs[Head_DstRegNo] = Arg.head();
				break;
			case "y":
				LocalRegs[Head_DstRegNo] = Arg.head();
				break;
			default:
				throw "bad reg";
			}
			switch (OC[3][0]) {
			case "x":
				Regs[Tail_DstRegNo] = Arg.tail();
				break;
			case "y":
				LocalRegs[Tail_DstRegNo] = Arg.tail();
				break;
			default:
				throw "bad reg";
			}

			break;
	case "p":
	//case "put_list":
		//opcode_test(OC, 'put_list', 3);
			var Head = get_arg(OC[1]);
			var Tail = get_arg(OC[2]);
			//assert(OC[3].length == 2);
			assert(OC[3][0] == "x");
			var DstRegNo = OC[3][1];
			Regs[DstRegNo] = new EList(Head, Tail);
			break;


	case "bif":
		switch (OC[1]) {
		case "hd": // like in erlang:hd/1
			var Arg = get_arg(OC[3][0]);
			if (!(Arg instanceof EListNonEmpty)) {
				jumpfr(OC[2], "badarg");
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]]=get_arg(OC[3][0]).head();
			}
			break;
		case "tl": // like in erlang:tl/1
			var Arg = get_arg(OC[3][0]);
			if (!(Arg instanceof EListNonEmpty)) {
				jumpfr(OC[2], "badarg");
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]]=get_arg(OC[3][0]).tail();
			}
			break;
		case "get": // identitical like erlang:get/1 // ie. random:*
			var r = PDict[get_arg(OC[3][0]).toString()];
			assert(OC[4][0] == "x");
			Regs[OC[4][1]] = (r ? r[1] : new EAtom("undefined"));
			break;
		case "tuple_size": // similar to gc_bif size // i.e. proplists:lookup
			var Arg = get_arg(OC[3][0]);
			if (!is_tuple(Arg)) {
				jumpfr(OC[2],"badarg"); // TODO: IMHO it is badarg. but need to recheck
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]] = Arg.tuple_arity();
			}
			break;
		case ">=": // i.e. proplists:lookup
			assert(OC[4][0] == "x");
			Regs[OC[4][1]] = (get_arg(OC[3][0]) >= get_arg(OC[3][1]) ? Etrue : Efalse);
			break;
		case "=:=": // i.e. proplists:lookup
			assert(OC[4][0] == "x");
			Regs[OC[4][1]] = (erljs_eq(get_arg(OC[3][0]), get_arg(OC[3][1]), true) ? Etrue : Efalse);
			break;
		case "==": // i.e. lists:filter
			assert(OC[4][0] == "x");
			Regs[OC[4][1]] = (erljs_eq(get_arg(OC[3][0]), get_arg(OC[3][1]), false) ? Etrue : Efalse);
			break;
		case "element": // i.e. proplists:lookup
			assert(OC[4][0] == "x");
			var Arg = get_arg(OC[3][1]),
				I = get_arg(OC[3][0]);
			if (!is_tuple(Arg) || !is_integer(I) || I > Arg.tuple_arity()|| I < 1) {
				jumpfr(OC[2],"badarg");
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]] = Arg.get(I-1);
			}
			break;
		case "and": // i.e. proplists:lookup
			assert(OC[4][0] == "x");
			var Arg1 = get_arg(OC[3][0]),
				Arg2 = get_arg(OC[3][1]);
			if (!is_boolean(Arg1) || !is_boolean(Arg2)) {
				jumpfr(OC[2],"badarg");
			} else {
				Regs[OC[4][1]] = (is_true(Arg1)&&is_true(Arg2) ? Etrue : Efalse);
			}
			break;
		case "self": // well, pretty everywhere.
			//		["bif", "self", "nofail", "", ["x", 0]]
			assert(OC[4][0] == "x");
			Regs[OC[4][1]] = Self;
			break;
		case "is_integer": // direct call to is_integer or erlang:is_integer in the body of function
			assert(OC[4][0] == "x");
			assert(OC[3].length == 1);
			var Arg = get_arg(OC[3][0]);
			Regs[OC[4][1]] = (is_integer(Arg) ? Etrue : Efalse);
			break;
		case "is_atom": // direct call to is_atom or erlang:is_atom in the body of function
			assert(OC[4][0] == "x");
			assert(OC[3].length == 1);
			var Arg = get_arg(OC[3][0]);
			Regs[OC[4][1]] = (is_atom(Arg) ? Etrue : Efalse);
			break;
		default:
			uns(OC);
		}
		break;

/*
	case "bif0":
		opcode_test(OC, 'bif0', 2);
			uns(OC);
			break;
	case "bif1":
		opcode_test(OC, 'bif1', 4);
			uns(OC);
			break;
	case "bif2":
		opcode_test(OC, 'bif2', 5);
			uns(OC);
			break;
*/
/*
	case "allocate":
		opcode_test(OC, 'allocate', 2);
			LocalRegs = [];
			//ignore;
			break;
	case "allocate_heap":
		//  i.e. ["test_heap",["alloc",[["words",0],["floats",1]]],1],
		opcode_test(OC, 'allocate_heap', 3);
			//ignore;
			break;
	case "allocate_zero": // i.e. ["allocate_zero",2,1],
		opcode_test(OC, 'allocate_zero', 2);
			//ignore;
			break;
//	case "allocate_zero":
//		opcode_test(OC, 'allocate_heap_zero', 3);
//			break;
	case "test_heap":
		opcode_test(OC, 'test_heap', 2);
			//ignore;
			break;
// {test_heap,3,4} // np. podczas konstruowania list
// {test_heap,{alloc,[{words,0},{floats,1}]},1}, // np. konwersji zmiennoprzycinkowej
	case "deallocate":
		opcode_test(OC, 'deallocate', 1);
			// E += OC[1]+1;
			LocalRegs = [];
			//ignore;
			break;
*/
	case "trim":
		opcode_test(OC, 'trim', 2); // {trim,2,0}, {trim,1,1} // cos zwiazanego z LocalRegs
			// it pops OC[1] elements from the stack?
			// i reall doesn't know exactly what this do. if have something to with y regs, allocate and stack pointer movement
			// why it have two args?
			for (var i = OC[1], j = 0; i < OC[1]+OC[2]; i++, j++) { // FIXME: just a guess
				LocalRegs[j] = LocalRegs[i];
			}
			break;
	case "init":
		opcode_test(OC, 'init', 1);
			assert(OC[1][0] == "y");
			LocalRegs[OC[1][1]] = undefined; // FIXME: just a guess what it really does.
			// if it is just this, it can removed completly from bytecode, as GC will clean it automatically at some point.
			break;
	//case "send":
		//opcode_test(OC, 'send', 0);
		//	uns(OC);
/*
{function,odbierz,0,66,[{label,65},{func_info,{atom,example},{atom,odbierz},0},{label,66},
...
{function,odbierz2,1,72,[{label,71},{func_info,{atom,example},{atom,odbierz2},1},{label,72},
...
*/

	case "loop_rec":
		opcode_test(OC, 'loop_rec', 2);
			uns(OC);
			break;
	case "select_val":
		opcode_test(OC, 'select_val', 3); // ozywana tez np. w if
			var Arg = get_arg(OC[1]);
			var found = false;
			//assert(is_integer(Arg), "c1"); // AFAIK it can be any primitive type: atom, integer, float.
			var C = OC[3]; // raczej literalna lista w postaci: {list,[{integer,1},{f,81},{integer,55},{f,82}]}
			assert(C.length == 2, "c2");
			assert(C[0] == "list", "c3");
			for (var i = 0; i < C[1].length; i += 2) { // use binary search for bigger tables
				NativeReductions++;
				//if (Arg == get_arg(C[1][i])) { // TODO: erljs_eq
				if (erljs_eq(Arg, get_arg(C[1][i]), true)) { // strict?
					found = true;
					jumpf(C[1][i+1]);
					break;
				}
			}
			if (!found) {
				jumpf(OC[2]);
			}
			//uns(OC);
			break;
	case "remove_message":
		opcode_test(OC, 'remove_message', 0);
			uns(OC);
			break;
	case "wait_timeout":
		opcode_test(OC, 'wait_timeout', 2);
			uns(OC);
			break;
	case "timeout":
		opcode_test(OC, 'timeout', 0);
			uns(OC);
			break;
	case "select_tuple_arity":
		//opcode_test(OC, 'select_tuple_arity', 3);
			var Arg = get_arg(OC[1]);
			if (is_tuple(Arg)) {
				var T = Arg.tuple_arity();
				var C = OC[3]; // raczej literalna lista w postaci: {list,[2,{f,81},3,{f,82}]}
				// C = get_arg(C);
				assert(C.length == 2);
				assert(C[0] == "list");
				var found = false;
				for (var i = 0; i < C[1].length; i += 2) {
					NativeReductions++;
					if (T == C[1][i]) {
						found = true;
						jumpf(C[1][i+1]);
						break;
					}
				}
				if (found) {
					break;
				}
			}
			jumpf(OC[2]); // not tuple or not found
			break;
	case "get_tuple_element":
		//opcode_test(OC, 'get_tuple_element', 3);
			var SrcArg = get_arg(OC[1]);
			assert(is_tuple(SrcArg));
			var WhichElemNo = OC[2];
			assert(SrcArg.tuple_arity() > WhichElemNo);
			//assert(OC[3].length == 2);
			var DstRegNo = OC[3][1];
			switch (OC[3][0]) {
			case "x":
				Regs[DstRegNo] = SrcArg.get(WhichElemNo);
				break;
			case "y":
				LocalRegs[DstRegNo] = SrcArg.get(WhichElemNo); // i.e. proplists:expand/2
				break;
			default:
				uns(OC);
			}
			break;
	case "arithfbif":
		//opcode_test(OC, 'arithfbif', 5);
			var FOp = OC[1];
			// Erlang checks for floating exceptions, and on any overloaf, underfloat, division by 0, negative sqrt throw error
			var OnFloatError = OC[2];
			switch (FOp) {
			case "fdiv":
			case "fmul":
			case "fadd":
			case "fsub":
				//assert(OC[3].length == 2); // was 4
				var Arg1 = get_arg(OC[3][0]); // was 4
				var Arg2 = get_arg(OC[3][1]); // was 4
				//assert(OC[4].length == 2); // was 5
				assert(OC[4][0] == "fr"); // was 5
				var DstRegNo = OC[4][1]; // was 5
				switch (FOp) {
				case "fadd":
					V = Arg1+Arg2;
					break;
				case "fsub":
					V = Arg1-Arg2;
					break;
				case "fmul":
					V = Arg1*Arg2;
					break;
				case "fdiv":
					if (Arg2 == 0 || Arg2 == 0.0) {
						jumpfr(OC[2],"badarith");
					} else {
						V = Arg1/Arg2;
					}
					break;
				default:
					uns(OC);
				}
				FloatRegs[DstRegNo] = V; // on fdiv error it will be undefined
				break;
			case "fnegate":
				//assert(OC[3].length == 1);
				var Arg1 = get_arg(OC[3][0]);
				//assert(OC[4].length == 2);
				assert(OC[4][0] == "fr");
				var DstRegNo = OC[4][1];
				FloatRegs[DstRegNo] = -Arg1;
				break;
			default:
				uns(OC);
			}
			break
	case "fconv":
		//opcode_test(OC, 'fconv', 2);
			var SrcArg = get_arg(OC[1]);
			//assert(OC[2].length == 2);
			assert(OC[2][0] == "fr");
			var DstFloatRegNo = OC[2][1];
			FloatRegs[DstFloatRegNo] = SrcArg; // cast to float. on error (in. trying atom), throw badarith.
			break;
	case "fmove": // identyczny kod jak fconv! merge + poprawka dla fconv
		//opcode_test(OC, 'fmove', 2);
			var SrcArg = get_arg(OC[1]);
			//assert(OC[2].length == 2);
			var DstFloatRegNo = OC[2][1];
			switch (OC[2][0]) {
			case "x":
				Regs[DstFloatRegNo] = SrcArg;
				break;
			case "y":
				LocalRegs[DstFloatRegNo] = SrcArg; // yes, it happend when there is many nested function calls to math:*
				break;
			case "fr":
				FloatRegs[DstFloatRegNo] = SrcArg;
				break;
			default:
				uns(OC);
			}
			break;
	case "put_tuple":
		//opcode_test(OC, 'put_tuple', 2);
			put_tuple_register = OC[2][1];
			var put_tuple_size = OC[1];
			put_tuple_i = 0;
			Regs[put_tuple_register] = new ETuple(put_tuple_size);
			break;
	case "P":
	//case "put":
		//opcode_test(OC, 'put', 1);
			var Arg = get_arg(OC[1]);
			if (put_tuple_i < 0 || put_tuple_register < 0) {
				throw "error in put";
			}
			// if (put_tuple_size < 0 || put_tuple_i >= put_tuple_size) {
			//	throw "error2 in put";
			//}
			Regs[put_tuple_register].put(put_tuple_i++, Arg);
			// TODO: if next instruction is not put, then reset put_tuple_* variables. Or is this legal to intermix put and other instructions?
			break;
	case "catch":
		opcode_test(OC, 'catch', 2);
			assert(OC[1].length == 2);
			assert(OC[1][0] == "y");
			assert(OC[2].length == 2);
			assert(OC[2][0] == "f");
			LocalEH.push([ OC[1][1], OC[2][1] ]);
			assert(LocalRegs[OC[1][1]] === undefined);
			//LocalRegs[OC[1][1]] = undefined; // just to make sure

			// TODO: assert that IP is in the same function

			// TODO: check if at OC[2][1] there is catch_end
			//     but probably it is leggal to not have catch_end immiedietly, for example in try.
			// I think that OC[1][1] is where too put catched exception
			break;
	case "catch_end":
		opcode_test(OC, 'catch_end', 1);
			assert(OC[1].length == 2);
			assert(OC[1][0] == "y");

			// we can came here in two ways. by normal entry, or due to the exception.
			// If there was normal entry, then OC[1][1] will be empty, and we do not need to do anything beyond removing EH
			// other wise, move it to the x0
			var V = LocalRegs[OC[1][1]];
			if (V !== undefined) {
				Regs[0] = V;
			}
			LocalEH.pop();

			break;
/*
["l",310],
	["try",["y",0],["f",311]],
		["call_ext",1,["extfunc","lists","sum",1]],
	["try_end",["y",0]],
		...
		"r",
["l",311],
	["try_case",["y",0]],
		...
		"r"
]],
*/
	case "try":
		// probably just like in catch, so go on
		opcode_test(OC, 'try', 2);
			assert(OC[1].length == 2);
			assert(OC[1][0] == "y");
			assert(OC[2].length == 2);
			assert(OC[2][0] == "f");
			LocalEH.push([ OC[1][1], OC[2][1] ]);
			assert(LocalRegs[OC[1][1]] === undefined);
			break;
	case "try_end":
		opcode_test(OC, 'try_end', 1);
			assert(OC[1].length == 2);
			assert(OC[1][0] == "y");
			//var V = LocalRegs[OC[1][1]];
			LocalEH.pop();
			break;
	case "try_case":
		opcode_test(OC, 'try_case', 1);
			assert(OC[1].length == 2);
			assert(OC[1][0] == "y");
			var V = LocalRegs[OC[1][1]];
			assert(V !== undefined);
			Regs[0] = V;
			LocalEH.pop();
			break;
	case "try_case_end":
		opcode_test(OC, 'try_case_end', 1);
			ni(OC);
			break;

	case "raise":
		opcode_test(OC, 'raise', 3);
		assert(OC[1].length == 2);
		assert(OC[1][0] == "f");
		assert(OC[2].length == 2);
		var ExceptionType = get_arg(OC[2][0]);
		var ExceptionValue = get_arg(OC[2][1]);
		assert(OC[3].length == 2);
		assert(OC[3][0] == "x");
		var SS = get_arg(OC[3]);
		alert(ExceptionType);
//		alert(ExceptionType.toString());
		alert(ExceptionValue);
		//alert(ExceptionValue.toString());
		throw "stop";
		break;

	case "make_fun2":
		//opcode_test(OC, 'make_fun2', 4); // this make 'local' fun.
			// the same version of the code that created the fun will be called (even if newer version  of  the  module  has been loaded).
			var DstFunction = OC[1];
			var HereId = OC[2]; // probably to know where fun was constructed (usefull for debuging)
			// ? looks like random integer. but is consistent accross compilations. probably something to do with reloading.
			// it can be also usefull if Fun is moved beetwen process or between Erlang nodes.
			var Something = OC[3]; // TODO: what is this?
			var NumberOfBindedVariables = OC[4];
			var BindedVarValues = [];
			for (var i = 0; i < NumberOfBindedVariables; i++) {
				BindedVarValues[i] = Regs[i];
			}
			var FunArity = OC[1][2] - NumberOfBindedVariables;
			var Uniq = Something; // This isn't exactly 'Uniq' element.
			Regs[0] = new EFunLocal(ThisModuleName, DstFunction, FunArity, NumberOfBindedVariables, HereId, BindedVarValues, Self, Uniq);

			break;
	case "jump":
			jumpf(OC[1]); // i.e. proplists:expand/2
			break;
	case "fclearerror":
		//opcode_test(OC, 'fclearerror', 0);
			FloatError = false;
			break;
	case "fcheckerror": // it always should go to func_info with reason badrith. (so is in emu.c)
		//opcode_test(OC, 'fcheckerror', 1);
			if (FloatError) {
				jumpfr(OC[1],"badarith");
			}
			break;
	case "case_end":
		//opcode_test(OC, 'case_end', 1);
			var NotMatchedArg = OC[1];
			assert(NotMatchedArg.length == 2);
			assert(NotMatchedArg[0] == "x");
			NotMatchedArg = get_arg(NotMatchedArg);
			var Reason = new ETuple([new EAtom("case_clause"), NotMatchedArg]);
			var StackTrace = new EList(
				new ETuple([]),
				new EListNil()
			);
			Reason = new ETuple([Reason, StackTrace]);
			erl_throw(new ETuple([new EAtom("EXIT"), Reason]));
			break;
	case "if_end":
			var Reason = new EAtom("if_clause");
			var StackTrace = new EList(
				new ETuple([]),
				new EListNil()
			);
			Reason = new ETuple([Reason, StackTrace]);
			erl_throw(new ETuple([new EAtom("EXIT"), Reason]));
			break;
	case "badmatch":
		//opcode_test(OC, 'badmatch', 1);
			var NotMatchedArg = OC[1];
			assert(NotMatchedArg.length == 2);
			assert(NotMatchedArg[0] == "x");
			NotMatchedArg = get_arg(NotMatchedArg);
			var Reason = new ETuple([new EAtom("badmatch"), NotMatchedArg]);
			var StackTrace = new EList(
				new ETuple([]),
				new EListNil()
			);
			Reason = new ETuple([Reason, StackTrace]);
			erl_throw(new ETuple([new EAtom("EXIT"), Reason]));
			break;
	case "func_info": // used by debuger and also when no clause found.
		//opcode_test(OC, 'func_info', 3);
			// TODO: Convert args properly (in fact we will need to remember them)
			var Arguments = new EListNil();
			var Reason = new EAtom("function_clause");
			var StackTrace = new EList(
				new ETuple([get_arg(OC[1]), get_arg(OC[2]), Arguments]),
				new EListNil()
			);
			Reason = new ETuple([Reason, StackTrace]);
			erl_throw(new ETuple([new EAtom("EXIT"), Reason]));
			break;
	case "label": // labels are already registered in pre execution phase
		//opcode_test(OC, 'label', 1);
			//continue;
			break;
	default:
			alert("unknown opcode "+OC);
			uns(OC);
			return;
	} // switch (opcode0)
	} // while (true)

	throw "internal_vm_error_break_at_mainloop";

} catch (err) {
	Stack.push([ThisFunctionSignature, ThisFunctionCode, IP-1, ThisModuleName, LocalRegs]);
	debug("Last OC: "+toJSON(OC));
	debug("exception error: "+err+"");
	for (var i = Stack.length-1; i >= 0; i--) {
		var S = Stack[i];
		debug((i==Stack.length-1 ? "in function " : "in call from ") + S[0] +" IP:" + S[2] );
	}
	//throw err;
	return "Error: "+err;
}
}

function erljs_vm_call0(Modules, StartFunctionSignature0, Args, ShowResult, ShowProfile, ShowTime, ShowStats) {
	//console.time("main loop");
	//console.timeEnd("main loop");
	var start, diff;

	if (ShowTime) {
		start = (new Date).getTime();
	}

	// on my 1.7 GHz laptop I have about 70-100KOPS
	// somtimes up to 210KOPS.
	var R = erljs_vm_call_(Modules, StartFunctionSignature0, Args, 500000, 1);

	if (ShowTime) {
		diff = (new Date).getTime() - start;
	}

	if (ShowTime || ShowStats) {
	debug("erljs VM statistics: time="+diff+"ms, "+Math.round((AllReductions+NativeReductions)/(diff*0.001))+
	"rps, Reductions="+AllReductions+", NativeReductions="+NativeReductions);
	}
	if (ShowProfile) {
	var P = [];
	for (var o in opcode_profiler) {
		if (opcode_profiler.hasOwnProperty(o)) {
			P.push([o, opcode_profiler[o]]);
		}
	}
	P.sort(function (a,b) { return b[1] - a[1]; });
	debug("erljs VM profile: "+toJSON(P));
	}

	return R;
}

function erljs_vm_call(Modules, StartFunctionSignature0, Args) {
//	return erljs_vm_call0(Modules, StartFunctionSignature0, Args, true, true, true, true);
	return erljs_vm_call0(Modules, StartFunctionSignature0, Args);
}

