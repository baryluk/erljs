/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

function debug(X) {
	//console.log(X);

	var r = document.createElement("div");
	r.innerText = X;
	document.getElementById("debugdiv").appendChild(r);

//	document.getElementById("debugform"). += X;
//	document.getElementById("debugform").innerText += "\n\r";
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
	throw "unknown opcode "+Object.toJSON(OC);
}

function get_opcode(O) {
	return (typeof(O) == "string" ? O : O[0]); // to accomodate "return", and another 0-length OC
}

var erljs_vm_initalized = false;
var Labels = {};
var FunctionsCode = {};

function erljs_vm_init(Modules) {
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
				var EntryPoint = FunctionCode[3];
				var Code = FunctionCode[4];
				var FunctionSignature = func_sig(ModuleName, Name, Arity);
				var NewCode = new Array();
				var l = 0;
				for (var k = 0; k < Code.length; k++) {
					var OC = Code[k];
					var opcode0 = get_opcode(OC);
					if (opcode0 == "label") {
						opcode_test(OC, 'label', 1)
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
}

function is_list(E) {
	//return E instanceof ETerm && E.is("list");
	return E instanceof EList || E instanceof EListNil;
}
function is_atom(E) {
	return E instanceof EAtom;
}
function is_tuple(L) {
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


function erljs_eq(A,B,strict) {
erljs_eq_loop:
while(true) {
	if (typeof A == typeof B) {
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
						if (A.empty() && B.empty()) {
							return true;
						}
						if (!erljs_eq(A.head(), B.head(), strict)) {
							return false;
						}
						A = A.tail();
						B = B.tail();
						continue;
					case "tuple":
						if (A.arity() != B.arity()) {
							return false;
						}
						for (var i = 0; i < A.arity(); i++) { // todo: opt
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
						throw "something missing";
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

//function erljs_lt(A,B,strict) {
//function erljs_ge(A,B,strict) {


var AllReductions = 0;
var NativeReductions = 0;

function erljs_vm_call_(Modules, StartFunctionSignature0, Args, MaxReductions, FullDebug) {
//	var Heap = [];
	var Stack = [];
	var Reg0 = 0; // x(0)
	var Regs = []; // x(1), ... x(N)
	var FloatRegs = []; // floating point
	var Self = 0; // id
	var Node = 0;
	var IP = 0; // pointer in current node
	var Reductions = 0;
	var LocalRegs = []; // unify Regs and LocalRegs into [2] array, and choose from them using 0 or 1 pointer.

//	var FunctionsCode = {};
//	var Labels = {};

	var ThisFunctionCode = [];
	var FloatError = false;

	if (!erljs_vm_initalized) {
		var start = (new Date).getTime(), diff = 0;
		erljs_vm_init(Modules);
		diff = (new Date).getTime() - start;
		debug("vm initialized in "+diff+"ms.");
		erljs_vm_initalized = true;
	}

	// start execution point
	var StartFunctionSignature = func_sig(StartFunctionSignature0[0], StartFunctionSignature0[1], StartFunctionSignature0[2]);

	// insert initial parameters of first function
	for (i = 0; i < Args.length; i++) {
		Regs[i] = Args[i];
	}

	var ThisModuleName = StartFunctionSignature0[0];
	var ThisFunctionSignature = StartFunctionSignature;
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
				return What[1];
			default:
				throw("what? "+What);
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
		jump(LabelF[1]);
	}
	function jumpfr(LabelF,Reason) {
		//assert(LabelF.length == 2);
		//assert(LabelF[0] == "f");
		last_reason = Reason;
		jump(LabelF[1]);
	}

	var put_tuple_register = -1, put_tuple_i = -1;

	// execution loop
	// TODO: optimalise it by:
	//    using smaller number of variables,
	//    create intermidiate (static) form which is
	//      better suited for it and more compact
	// Note: keep all identifiers (function names and variables) disriptive. They will be compressed automatically using compressor.
	var TracedModules = {};
	//TracedModules = {"example":""};

	NativeReductions = 0;
try {

mainloop:
	while (true) {

	var OC = ThisFunctionCode[IP];

	if (ThisModuleName in TracedModules) {
	if (FullDebug >= 1) {
		if (FullDebug >= 1) {
			try {
				debug("  x0: "+Object.toJSON(Regs[0]));
				debug("  x1: "+Object.toJSON(Regs[1]));
				debug("  x2: "+Object.toJSON(Regs[2]));
				debug("  x3: "+Object.toJSON(Regs[3]));
				debug("  y0: "+Object.toJSON(LocalRegs[0]));
				debug("  y1: "+Object.toJSON(LocalRegs[1]));
			} catch (err) { debug("  not displaying registers -- too long values"); }
		}
		debug("Function: "+ThisFunctionSignature+"  IP: " + IP + "  (Reduction counter: "+Reductions+", Native reduction counter: "+NativeReductions+").");
		debug("Instruction: "+Object.toJSON(OC));
	}
	}
//

	IP++;

	Reductions++;

/*
	if (FullDebug) {
		document.getElementById("Red").value = Reductions;
	}
	if (FullDebug > 2) {
		document.getElementById("X0").value = Object.toJSON(Regs[0]);
		document.getElementById("X1").value = Object.toJSON(Regs[1]);
		document.getElementById("X2").value = Object.toJSON(Regs[2]);
	}
*/

	if (Reductions > MaxReductions) {
		throw "too_many_reduction";
	}

	AllReductions = Reductions;

	var opcode0 = OC[0];

	if (opcode_profiler[opcode0]) {
		opcode_profiler[opcode0]++;
	} else {
		opcode_profiler[opcode0]=1;
	}

	if (ThisModuleName in TracedModules) {
/*
	if (FullDebug>1) {
		debug("profile: "+Object.toJSON(opcode_profiler));
	}
*/
	if (FullDebug) {
		debug("-----");
	}
	}


	switch (opcode0) {
	case "test":
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
				if (!is_atom(Arg)) { // TODO: this should be more specific.
					jumpf(OC[2]);
				}
				break;
			case "is_eq_exact":
				//assert(OC[3].length == 2);
				if (get_arg(OC[3][0]) != get_arg(OC[3][1])) {
					jumpf(OC[2]);
				}
				break;
			case "is_lt": // this tests should be performd using correct ordering from Erlang
				//assert(OC[3].length == 2);
				if (!(get_arg(OC[3][0]) < get_arg(OC[3][1]))) {
					jumpf(OC[2]);
				}
				break;
			case "is_ge": // yes there is only < and >= opcode in VM. 
				//assert(OC[3].length == 2);
				if (!(get_arg(OC[3][0]) >= get_arg(OC[3][1]))) {
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
				if (!(Arg instanceof EList)) {
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
			default:
				uns(OC);
			}
			break;
	case "move":
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
	case "gc_bif":
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
						V = Arg1 << Arg2; // example: -33 bsl 4 = -528. 33 bsl 4 = 528. 33 bsl -4 = 2. -33 bsl -4 = -3.
						break;
					case "bsr":
						V = Arg1 >> Arg2; // example: -33 bsr 4 = -3. -33 bsr -1 = -66. 33 bsr 1 = 16. 33 bsr -1 = 66.
						break;
					case "div": // todo: merge div and rem cases, becuase in case of bignum's both are computed in the same time. also Arg2==0 check is the same.
						if (Arg2 == 0) {
							throw "badarith";
						}
						V = Math.round(Arg1/Arg2); // example: 3 div 4 = 0. 5 div 4 = 1. -3 div 4 = 0. -5 div 4 = -1. 5 div -4 = -1. 5 div -6 = 0. -5 div -4 = 1. -5 div -6 = 0.
						break;
					case "rem":
						if (Arg2 == 0) {
							throw "badarith";
						};
						V = Arg1 % Arg2;  // Arg2 and -Arg2 gives same Result.  -Arg1 gives -Result
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
						var l = 0;
						while (Arg1 instanceof EList) {
							l++;
							Arg1 = Arg1.tail();
							NativeReductions++;
						}
						if (!(Arg1 instanceof EListNil)) throw "badarg"; // Arg must be proper list.
						V = l;
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
			}
			break;
	case "get_list":
		//opcode_test(OC, 'get_list', 3);
			var Arg = get_arg(OC[1]);
			//assert(OC[2].length == 2);
			var Head_DstRegNo = OC[2][1];
			//assert(OC[3].length == 2);
			assert(OC[3][0] == "x");
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
			Regs[Tail_DstRegNo] = Arg.tail();
			break;
	case "put_list":
		//opcode_test(OC, 'put_list', 3);
			var Head = get_arg(OC[1]);
			var Tail = get_arg(OC[2]);
			//assert(OC[3].length == 2);
			assert(OC[3][0] == "x");
			var DstRegNo = OC[3][1];
			Regs[DstRegNo] = new EList(Head, Tail);
			break;
	case "call":
	case "call_only":
		//opcode_test(OC, 'call', 2) || opcode_test(OC, 'call_only', 2);
			switch (opcode0) {
			case "call":
				Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs]);
				LocalRegs = [];
			default:
				var ModuleName = OC[2][0];
				var Name = OC[2][1];
				var Arity = OC[2][2];
				//assert(OC[1] == Arity);
				var FunctionSignature = func_sig(ModuleName, Name, Arity);
				ThisFunctionCode = FunctionsCode[FunctionSignature]; // TODO: read the same version of module, not newset one
				ThisFunctionSignature = FunctionSignature;
				//ThisModuleName = ModuleName;
				//ThisLabels = Labels[ThisModuleName];
				//jump(EntryPoint);
				IP = GeneralEntryPoint;
			}
			break;
	case "call_last":
		//opcode_test(OC, 'call_last', 3);
			uns(OC);
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


	case "call_ext":
	case "call_ext_only":
	case "call_ext_last":
	case "call_lists":
	case "call_lists_only":
			last_reason = "";
			var native = false;
		//opcode_test(OC, 'call_ext', 2) || opcode_test(OC, 'call_ext_only', 2) || opcode_test(OC, 'call_lists', 2) || opcode_test(OC, 'call_lists_only', 2);
		//opcode_test(OC, 'call_ext_last', 3); // ? last parameters is integer, i.e. 1

			var ModuleName = OC[2][1]; // todo: this can be parametrized module!
			var Name = OC[2][2];
			var Arity = OC[2][3];
			// TODO: prepare hash table for this.
			if (ModuleName == "erljs") {
				var NA = Name+"/"+Arity;
				switch (NA) {
				case "eval/1":
					var T=eval(Regs[0]);
					if (T!==undefined) Regs[0] = T; else Regs[0] = 0;
					break;
				case "console_log/1":
					Regs[0] = 0;
					console.log(Regs[0]);
					break;
				default:
					throw "undef";
				}
				native=true;
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
				native=true;
			} else if (ModuleName == "math") {
				var NA = Name+"/"+Arity;

				switch (NA) {
				//case "length/1": // in gc_bif
				//	break;

				case "++/2": // concats two lists. left cannot be improper
					if (!(is_list(Regs[0]) && is_list(Regs[1]))) throw "badarg";
					if (!Regs[1].empty()) {
						if (!Regs[0].empty()) {
							var temp0 = new EList(-137,-138);
							var temp = temp0;
							while (Regs[0] instanceof EList) {
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
					uns(OC); break;
				case "apply/2": // apply(Fun,[a,b,c])
					// same as {M,F,Binded}=Fun, apply(M,F,Binded++[a,b,c]). ?
					uns(OC);
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
					uns(OC);
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
				//case "size/1": uns(OC); break; // for tuples or binaries // in gc_bif
				//	Regs[0] = Regs[0].tuple_arity();


				case "atom_to_list/1": uns(OC); break;
				case "list_to_atom/1": uns(OC); break;
				case "list_to_integer/1": uns(OC); break;
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
				case "integer_to_list/2": uns(OC); break;
				case "list_to_float/1": uns(OC); break;
				case "float_to_list/1": uns(OC); break;

				case "make_fun/3": uns(OC); break;  // for fun M:F/A

				case "put/2": uns(OC); break;
				case "get/0": uns(OC); break;
				case "get/1": uns(OC); break;
				case "get_keys/1": uns(OC); break;
				case "erase/0": uns(OC); break;
				case "erase/1": uns(OC); break;

				//case "abs/1": uns(OC); break; // abs value of float or int // in gc_bif
				case "min/2": uns(OC); break;
				case "max/2": uns(OC); break;
				case "make_ref/0": uns(OC); break;
				case "self/0": uns(OC); break;
				case "time/0": uns(OC); break; // {Hour,Minute,Second} // {9,42,44}
				case "date/0": uns(OC); break; // {Year,Month,Day}// {1996,11,6}
				case "localtime/0": uns(OC); break; // {{Year,Month,Day}, {Hour,Minute,Second}} // {{1996,11,6},{14,45,17}}
				case "fun_info/1": uns(OC); break;
				case "fun_info/2": uns(OC); break;
				case "get_module_info/1": uns(OC); break;
				case "get_module_info/2": uns(OC); break;
				case "yield/0": continue mainloop; break; // ignore
				case "halt/0":
					alert("Halted:"+Regs[0]);
					return;
				case "halt/1":
					alert("Halted.");
					return;
				default:
					throw "not implemented native function: "+Module+":"+NA;
					break;
				}
				native=true;
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
								while (Regs[0] instanceof EList) {
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
					native=true;
				} else {
					switch (opcode0) {
					case 'call_ext':
					case 'call_lists':
						Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs]);
						LocalRegs = [];
					default: // fallthrough
						var FunctionSignature = func_sig(ModuleName, Name, Arity);
						// if no such function?
						ThisFunctionCode = FunctionsCode[FunctionSignature];
						if (ThisFunctionCode == undefined) throw "undef";
						ThisFunctionSignature = FunctionSignature;
						ThisModuleName = ModuleName;
						ThisLabels = Labels[ThisModuleName];
						//jump(EntryPoint);
						IP = GeneralEntryPoint;
					}
				}
			}
			if (native && /_(only|last)$/.test(opcode0) && Stack.length == 0) { return Regs[0]; }
			break;
	case "return":
		//opcode_test(OC, 'return', 0);
			Regs = [Regs[0]];
			if (Stack.length != 0) {
				var X = Stack.pop();
				ThisFunctionSignature = X[0];
				ThisFunctionCode = X[1];
				IP = X[2];
				ThisModuleName = X[3];
				LocalRegs = X[4];
				ThisLabels = Labels[ThisModuleName];
			} else {
				return Regs[0];
			}
			break;

	case "bif":
		switch (OC[1]) {
		case "hd": // like in erlang:hd/1
			if (!(Regs[0] instanceof EList)) {
				jumpfr(OC[2], "badarg");
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]]=get_arg(OC[3][0]).head();
			}
			break;
		case "tl": // like in erlang:tl/1
			if (!(Regs[0] instanceof EList)) {
				jumpfr(OC[2], "badarg");
			} else {
				assert(OC[4][0] == "x");
				Regs[OC[4][1]]=get_arg(OC[3][0]).tail();
			}
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
{loop_rec,{f,70},{x,0}},{test,is_atom,{f,69},[{x,0}]},{select_val,{x,0},{f,69},{list,[{atom,a},{f,67},{atom,f},{f,68}]}},{label,67},remove_message,{move,{atom,ok},{x,0}},return,{label,68},remove_message,{move,{atom,j},{x,0}},return,{label,69},{loop_rec_end,{f,66}},{label,70},{wait_timeout,{f,66},{integer,1111}},timeout,{move,{atom,kkk},{x,0}},return]}

{function,odbierz2,1,72,[{label,71},{func_info,{atom,example},{atom,odbierz2},1},{label,72},
{allocate,1,1},{move,{x,0},{y,0}},
{label,73},{loop_rec,{f,76},{x,0}},{test,is_tuple,{f,74},[{x,0}]},{test,test_arity,{f,75},[{x,0},3]},{get_tuple_element,{x,0},0,{x,1}},{get_tuple_element,{x,0},1,{x,2}},{get_tuple_element,{x,0},2,{x,3}},{test,is_eq_exact,{f,75},[{x,1},{atom,a}]},{test,is_eq_exact,{f,75},[{x,2},{y,0}]},{test,is_eq_exact,{f,75},[{x,3},{y,0}]},remove_message,{move,{atom,ok},{x,0}},{deallocate,1},return,{label,74},{test,is_eq_exact,{f,75},[{x,0},{atom,f}]},remove_message,{move,{atom,j},{x,0}},{deallocate,1},return,{label,75},{loop_rec_end,{f,73}},{label,76},{wait_timeout,{f,73},{integer,1111}},timeout,{move,{atom,kkk},{x,0}},{deallocate,1},return]}
*/

	case "loop_rec":
		opcode_test(OC, 'loop_rec', 2);
			uns(OC);
			break;
	case "select_val":
		opcode_test(OC, 'select_val', 3); // ozywana tez np. w if
			var Arg = get_arg(OC[1]);
			var found = false;
			assert(is_integer(Arg));
			var C = OC[3]; // raczej literalna lista w postaci: {list,[{integer,1},{f,81},{integer,55},{f,82}]}
			assert(C.length == 2);
			assert(C[0] == "list");
			for (var i = 0; i < C[1].length; i += 2) { // use binary search for bigger tables
				NativeReductions++;
				if (Arg == get_arg(C[1][i])) {
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
				var C = get_arg(OC[3]); // raczej literalna lista w postaci: {list,[2,{f,81},3,{f,82}]}
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
			if (OC[3][0] == "x") {
				Regs[DstRegNo] = SrcArg.get(WhichElemNo);
			} else {
				uns(OC);
			}
			break;
	case "arithfbif":
		//opcode_test(OC, 'arithfbif', 5);
			var FOp = OC[1];
			var OnFloatError = OC[2]; // Erlang checks for floating exceptions, and on any overloaf, underfloat, division by 0, negative sqrt throw error
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
			if (OC[2][0] == "x") {
				Regs[DstFloatRegNo] = SrcArg;
			} else if (OC[2][0] == "y") {
				LocalRegs[DstFloatRegNo] = SrcArg; // yes, it happend when there is many nested function calls to math:*
			} else if (OC[2][0] == "fr") {
				FloatRegs[DstFloatRegNo] = SrcArg;
			} else {
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
	case "put":
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
	case "make_fun2":
		//opcode_test(OC, 'make_fun2', 4); // this make 'local' fun.
			// the same version of the code that created the fun will be called (even if newer version  of  the  module  has been loaded).
			var DstFunction = OC[1];
			var HereId = OC[2]; // probably to know where fun was constructed (usefull for debuging)
			var Something = OC[3]; // ? looks like random integer. but is consistent accross compilations. probably something to do with reloading.
				// it can be also usefull if Fun is moved beetwen process or between Erlang nodes.
			var NumberOfBindedVariables = OC[4];
			var BindedVarValues = [];
			for (var i = 0; i < NumberOfBindedVariables; i++) {
				BindedVarValues[i] = Regs[i];
			}
			Regs[0] = new EFun(DstFunction, BindedVarValues);
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
			throw "case_end";
			break;
	case "badmatch":
		//opcode_test(OC, 'badmatch', 1);
			var NotMatchedArg = OC[1];
			throw "badmatch";
			break;
	case "func_info": // used by debuger and also when no clause found.
		//opcode_test(OC, 'func_info', 3);
			throw "error in "+OC + " at " +ThisFunctionSignature +" IP=" + IP + " last_reason="+last_reason;
			return;
	case "label": // labels are already registered in pre execution phase
		//opcode_test(OC, 'label', 1);
			//continue;
			break;
	default:
			uns(OC);
			return;
	} // switch (opcode0)
	} // while (true)

	throw "internal_vm_error_break_at_mainloop";

} catch (err) {
	Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs]);
	debug("exception error: "+err+"");
	for (var i = Stack.length-1; i >= 0; i--) {
		var S = Stack[i];
		debug((i==Stack.length-1 ? "in function " : "in call from ") + S[0] +" IP:" + S[2] );
	}
	throw err;
}
}

function erljs_vm_call(Modules, StartFunctionSignature0, Args) {
	//console.time("main loop");
	//console.timeEnd("main loop");
	var start = (new Date).getTime(), diff = 0;

	// on my 1.7 GHz laptop I have about 70-100KOPS
	// somtimes up to 210KOPS.
	var R = erljs_vm_call_(Modules, StartFunctionSignature0, Args, 500000, 1);

	diff = (new Date).getTime() - start;

	debug("diff="+diff+"ms. "+Math.round((AllReductions+NativeReductions)/(diff*0.001))+
	"rps Red="+AllReductions+" NativeRed="+NativeReductions+
	" profile: "+Object.toJSON(opcode_profiler));

	return R;
}

