/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

// asert test
function assert(cond) {
	if (!cond) {
		alert("assertion failed, breaking.");
		throw "assertion failed";
	}
}

/** Tests if given OpCode is Name/Arity. */
function opcode_test(OC, Name, Arity) {
	if (Arity == 0) {
		return OC == Name;
	} else {
		if (OC[0] == Name) {
			assert(OC.length == Arity+1);
			return true;
		}
	}
}

/** Returns String representing function unicly (ie. mod:name/5) */
function func_sig(ModuleName, Name, Arity) {
	return ModuleName+":"+Name+"/"+Arity;
}
function erljs_vm_call_(Modules, StartFunctionSignature0, Args, MaxReductions, FullDebug) {
	var Heap = [];
	var Stack = [];
	var Reg0 = 0; // x(0)
	var Regs = []; // x(1), ... x(N)
	var FloatRegs = []; // floating point
	var Self = 0; // id
	var Node = 0;
	var IP = 0; // pointer in current node
	var Reductions = 0;
	var LocalRegs = []; // unify Regs and LocalRegs into [2] array, and choose from them using 0 or 1 pointer.

	var FunctionsCode = {};

	var Labels = {};

	var ThisFunctionCode = [];
	var FloatError = false;

	var opcode_profiler = {};

function init() {
	// convert Modules which contains all modules to internal format
	// registers all functions, and labels.  (can there be jumps to labels outside of the function to the function in the same modules? (It can be, as sometimes compiler do strange things).
	for (var i = 0; i < Modules.length; i++) {
		var ModuleName = Modules[i][0];
		var Module = Modules[i][1];
		Labels[ModuleName] = {};
		for (var j = 0; j < Module.length; j++) {
		FunctionCode = Module[j];
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
					if (opcode_test(OC, 'label', 1)) {
						//console.log("dodaje label " + OC[1] + " na pozycji "+k+ " w funkcji "+ FunctionSignature);
						Labels[ModuleName][OC[1]] = [FunctionSignature, l];
					} else {
						NewCode[l++] = OC;
					}
				}
				FunctionsCode[FunctionSignature] = NewCode;
			} else {
				alert("not a function at position " + j + " of module "+ModuleName);
			}
		}
	}
}

	init();

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
		throw "no such function";
	}

	var GeneralEntryPoint = 1; // 2 with labels.

	IP = GeneralEntryPoint;

	function get_arg(What) {
		if (What == "nil") return new EListNil();
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
				alert("what? "+What);
		}
	}

	function jump(LabelNo) {
		var L = ThisLabels[LabelNo];
		//var L = Labels[ThisModuleName][LabelNo];
		IP = L[1];
	}
	function jumpf(LabelF) {
		assert(LabelF.length == 2);
		assert(LabelF[0] == "f");
		jump(LabelF[1]);
	}

	function uns(OC) {
		alert("Unknown or notsupported opcode "+OC);
		throw "unknown opcode";
	}

	var put_tuple_register = -1, put_tuple_i = -1;

	// execution loop
	// TODO: optimalise it by:
	//    using smaller number of variables, 
	//    perform switch based decoder, and inline (preprocesor) this opcode_test calls.
	//    remove labels from code
	//    create intermidiate (static) form whic his better suited for it and more compact
	//    profile code, to know which opcodes are most often occuring (call? move?)
	// Note: keep all identifiers (function names and variables) disriptive. They will be compressed automatically using compressor.
	while (true) {

	var OC = ThisFunctionCode[IP];

	if (FullDebug) {
		console.log("Function: "+ThisFunctionSignature+"  IP: " + IP + "  (Reduction counter: "+Reductions+"). Instruction: "+Object.toJSON(OC));
		/*
		console.log("  x0: "+Object.toJSON(Regs[0]));
		console.log("  x1: "+Object.toJSON(Regs[1]));
		console.log("  x2: "+Object.toJSON(Regs[2]));
		*/
	}

	IP++;

	Reductions++;
	if (FullDebug) {
		document.getElementById("Red").value = Reductions;
	}
/*
	document.getElementById("X0").value = Object.toJSON(Regs[0]);
	document.getElementById("X1").value = Object.toJSON(Regs[1]);
	document.getElementById("X2").value = Object.toJSON(Regs[2]);
*/

	if (Reductions > MaxReductions) {
		return "overreduce";
	}

	var opcode0 = (typeof(OC) == "string" ? OC : OC[0]); // to accomodate "return", and another 0-length OC

	if (opcode_profiler[opcode0]) {
		opcode_profiler[opcode0]++;
	} else {
		opcode_profiler[opcode0]=1;
	}
	if (FullDebug) {
		console.log("profile: "+Object.toJSON(opcode_profiler));
	}

	switch (opcode0) {
	case "label":
		opcode_test(OC, 'label', 1);
			//continue; // labels are already registered in pre execution phase
			break;
	case "func_info":
		opcode_test(OC, 'func_info', 3); // used by debuger and also when no clause found.
			alert("bad_clause in "+OC);
			return;
	case "call":
	case "call_only":
		opcode_test(OC, 'call', 2) || opcode_test(OC, 'call_only', 2);
			if (opcode0 == "call") {
				Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs]);
				LocalRegs = [];
			}
			var ModuleName = OC[2][0];
			var Name = OC[2][1];
			var Arity = OC[2][2];
			assert(OC[1] == Arity);
			var FunctionSignature = func_sig(ModuleName, Name, Arity);
			ThisFunctionCode = FunctionsCode[FunctionSignature]; // TODO: read the same version of module, not newset one
			ThisFunctionSignature = FunctionSignature;
			//ThisModuleName = ModuleName;
			//ThisLabels = Labels[ThisModuleName];
			//jump(EntryPoint);
			IP = GeneralEntryPoint;
			break;
	case "call_last":
		opcode_test(OC, 'call_last', 3);
			uns(OC);
			break;
	case "call_ext":
	case "call_ext_only":
	case "call_lists":
	case "call_lists_only":
		opcode_test(OC, 'call_ext', 2) || opcode_test(OC, 'call_ext_only', 2) || opcode_test(OC, 'call_lists', 2) || opcode_test(OC, 'call_lists_only', 2);
			var ModuleName = OC[2][1];
			var Name = OC[2][2];
			var Arity = OC[2][3];
			var NA = Name+"/"+Arity;
			// TODO: prepare hash table for this.
			if (ModuleName == "erljs") {
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
					uns(OC);
				}
				if (Stack.length == 0) { return Regs[0]; }
			} else if (ModuleName == "erlang") {
				switch (NA) {
				case "++/2": // concats two lists. left cannot be improper
					uns(OC);
				case "apply/2": uns(OC); break; // apply(Fun,[a,b,c])
					uns(OC);
				case "apply/3": uns(OC); break; // aply(M,F,[a,b,c])
					uns(OC);
				case "tl/1": uns(OC); break; // tail f list. badarg is L is [].
				//case "size/1": uns(OC); break; // for tuples or binaries
				//	Regs[0] = Regs[0].tuple_arity();

				case "atom_to_list/1": uns(OC); break;
				case "list_to_atom/1": uns(OC); break;
				case "list_to_integer/1": uns(OC); break;
				case "integer_to_list/1": uns(OC); break;
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

				//case "abs/1": uns(OC); break; // abs value of float or int
				case "min/2": uns(OC); break;
				case "max/2": uns(OC); break;
				case "make_ref/0": uns(OC); break;
				case "self/0": uns(OC); break;
				case "time/0": uns(OC); break; // {Hour,Minute,Second} // {9,42,44}
				case "date/0": uns(OC); break; // {Year,Month,Day}// {1996,11,6}
				case "localtime/0": uns(OC); break; // {{Year,Month,Day}, {Hour,Minute,Second}} // {{1996,11,6},{14,45,17}}
				case "fun_info/1": uns(OC); break;
				case "fun_info/2": uns(OC); break;
				case "yield/0":
				case "halt/0":
					alert("Halted.");
					return;
				case "halt/1":
					alert("Halted:"+Regs[0]);
					return;
				default:
					uns(OC);
					break;
				}
				uns(OC);
			} else {
				//if (ModuleName == "lists" && Name == "reverse" /* 1,2 */) {
				//}

				if (opcode0 == 'call_ext' || opcode0 == 'call_lists') {
					Stack.push([ThisFunctionSignature, ThisFunctionCode, IP, ThisModuleName, LocalRegs]);
					LocalRegs = [];
				}
				var FunctionSignature = func_sig(ModuleName, Name, Arity);
				// if no such function?
				ThisFunctionCode = FunctionsCode[FunctionSignature];
				ThisFunctionSignature = FunctionSignature;
				ThisModuleName = ModuleName;
				ThisLabels = Labels[ThisModuleName];
				//jump(EntryPoint);
				IP = GeneralEntryPoint;
			}
			break;
	//case "call_ext_last":
		//opcode_test(OC, 'call_ext_last', 3);
		//	uns(OC);
		//	break;
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
	case "allocate":
		opcode_test(OC, 'allocate', 2);
			LocalRegs = [];
			//ignore;
			break;
	case "allocate_heap":
		opcode_test(OC, 'allocate_heap', 3);
			//ignore;
			break;
	case "allocate_zero":
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
	case "init":
		opcode_test(OC, 'init', 1);
			uns(OC);
			break;
	case "deallocate":
		opcode_test(OC, 'deallocate', 1);
			LocalRegs = [];
			//ignore;
			break;
	case "trim":
		opcode_test(OC, 'trim', 2); // {trim,2,0}// cos zwiazanego z LocalRegs
			//ignore;
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
			if ((typeof(Arg) == "number" && !isNaN(Arg)) || (typeof(number) == "object" && Arg.is("integer"))) {
				jumpf(OC[2]);
				var T = Arg;
				var C = OC[3]; // raczej literalna lista w postaci: {list,[{integer,1},{f,81},{integer,55},{f,82}]}
				assert(C.length == 2);
				assert(C[0] == "list");
				for (var i = 0; i < C[1].length; i += 2) {
					if (T == get_arg(C[1][i])) {
						found = true;
						jumpf(C[1][i+1]);
						break;
					}
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
	case "timeut":
		opcode_test(OC, 'timeout', 0);
			uns(OC);
			break;
	case "return":
		opcode_test(OC, 'return', 0);
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
	case "test":
		opcode_test(OC, 'test', 3);
			assert(OC[2].length == 2);
			assert(OC[2][0] == "f");
			switch (OC[1]) {
			case "is_tuple":
				assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!Arg.is("tuple")) {
					jumpf(OC[2]);
				}
				break;
			case "test_arity":
				assert(OC[3].length == 2);
				var Arg = get_arg(OC[3][0]);
				if (!(Arg.is("tuple") && Arg.tuple_arity() == OC[3][1])) {
					jumpf(OC[2]);
				}
				break;
			case "is_integer":
				assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (isNaN(Arg) && !Arg.is("integer")) {
					jumpf(OC[2]);
				}
				break;
			case "is_eq_exact":
				assert(OC[3].length == 2);
				if (get_arg(OC[3][0]) != get_arg(OC[3][1])) {
					jumpf(OC[2]);
				}
				break;
			case "is_lt": // this tests should be performd using correct ordering from Erlang
				assert(OC[3].length == 2);
				if (!(get_arg(OC[3][0]) < get_arg(OC[3][1]))) {
					jumpf(OC[2]);
				}
				break;
			case "is_ge": // yes there is only < and >= opcode in VM. 
				assert(OC[3].length == 2);
				if (!(get_arg(OC[3][0]) >= get_arg(OC[3][1]))) {
					jumpf(OC[2]);
				}
				break;
			case "is_nonempty_list":
				assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!(typeof(Arg) == "object" && Arg.is("list") && !Arg.empty())) {
					jumpf(OC[2]);
				}
				break;
			case "is_nil":
				assert(OC[3].length == 1);
				var Arg = get_arg(OC[3][0]);
				if (!Arg.is("list") || !Arg.empty()) {
					jumpf(OC[2]);
				}
				break;
			default:
				alert("Exception test: "+OC[1]);
				uns(OC);
				return;
			}
			break;
	case "select_tuple_arity":
		opcode_test(OC, 'select_tuple_arity', 3);
			var Arg = get_arg(OC[1]);
			if (!Arg.is("tuple")) {
				jumpf(OC[2]);
			} else {
				var T = Arg.tuple_arity();
				var C = get_arg(OC[3]); // raczej literalna lista w postaci: {list,[2,{f,81},3,{f,82}]}
				assert(C.length == 2);
				assert(C[0] == "list");
				var found = false;
				for (var i = 0; i < C[1].length; i += 2) {
					if (T == C[1][i]) {
						found = true;
						jumpf(C[1][i+1]);
						break;
					}
				}
				if (!found) {
					jumpf(OC[2]);
				}
			}
			break;
	case "get_tuple_element":
		opcode_test(OC, 'get_tuple_element', 3);
			var SrcArg = get_arg(OC[1]);
			assert(SrcArg.is("tuple"));
			var WhichElemNo = OC[2];
			assert(SrcArg.tuple_arity() > WhichElemNo);
			assert(OC[3].length == 2);
			var DstRegNo = OC[3][1];
			if (OC[3][0] == "x") {
				Regs[DstRegNo] = SrcArg.get(WhichElemNo);
			} else {
				alert("not xy1");
				uns(OC);
			}
			break;
	case "move":
		opcode_test(OC, 'move', 2);
			var SrcArg = get_arg(OC[1]);
			assert(OC[2].length == 2);
			var DstRegNo = OC[2][1];
			if (OC[2][0] == "x") {
				Regs[DstRegNo] = SrcArg;
			} else if (OC[2][0] == "y") {
				LocalRegs[DstRegNo] = SrcArg;
			} else {
				alert("not xy2");
				uns(OC);
			}
			break;
	case "gc_bif":
		opcode_test(OC, 'gc_bif', 5);
			// OC[3]? // it looks it is is mostly number of args: assert(OC[3] == OC[4].length == 2); // but sometimes it is 3.
			assert(OC[5].length == 2);
			assert(OC[5][0] == "x");
			var DstRegNo = OC[5][1];
			var Arg1 = get_arg(OC[4][0]);
			var V;
			if (OC[4].length == 2
//					&& (OC[1] == "*" || OC[1] == "+" || OC[1] == "-"
//					|| OC[1] == "div" || OC[1] == "rem"
//					|| OC[1] == "bor" || OC[1] == "band" || OC[1] == "bxor" || OC[1] == "bsr" || OC[1] == "bsl")
			) {
				assert(OC[4].length == 2);
				var Arg2 = get_arg(OC[4][1]);
				//if (!Arg1.is("integer") || !Arg2.is("integer")) jumpf(OC[2]);
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
					V = Arg1 << Arg2; // -33 bsl 4 = -528. 33 bsl 4 = 528. 33 bsl -4 = 2. -33 bsl -4 = -3.
					break;
				case "bsr":
					V = Arg1 >> Arg2; // -33 bsr 4 = -3. -33 bsr -1 = -66. 33 bsr 1 = 16. 33 bsr -1 = 66.
					break;
				case "div":
					assert(Arg2 != 0);// Arg2==0 is bad_arg
					V = Arg1/Arg2; // integer!
					break;
				case "rem":
					assert(Arg2 != 0); // Arg2==0 is bad_arg,
					V = Arg1 % Arg2;  // Arg2 and -Arg2 gives same Result.  -Arg1 gives -Result
					break;
				default:
					uns("OC");
				}
			} else if (OC[4].length == 1) {
				if (OC[1] == "-" || OC[1] == "bnot") {
					//if (!Arg1.is("integer") && ) jumpf(OC[2]);
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
				} else if (OC[1] == "size") {
					if (Arg1.is("tuple")) {
						V = Arg1.tuple_arity();
					} else if (Arg1.is("binary")) {
						V = Arg1.size();
					} else {
						jumpf(OC[2]);
					}
				} else if (OC[1] == "abs") {
					//if (!Arg1.is("integer") && !Arg1.is("float")) jumpf(OC[2]);
					V = Math.abs(Arg1);
				} else {
					uns(OC);
				}
			} else {
				uns(OC);
			}
			Regs[DstRegNo] = V;
			break;
	case "test_heap":
		opcode_test(OC, 'test_heap', -1);
// {test_heap,3,4} // np. podczas konstruowania list
// {test_heap,{alloc,[{words,0},{floats,1}]},1}, // np. konwersji zmiennoprzycinkowej
			//ignore; // always ok
			break
	case "arithfbif":
		opcode_test(OC, 'arithfbif', 5);
			var FOp = OC[1];
			var OnFloatError = OC[2]; // Erlang checks for floating exceptions, and on any overloaf, underfloat, division by 0, negative sqrt throw error
			switch (FOp) {
			case "fdiv":
			case "fmul":
			case "fadd":
			case "fsub":
				assert(OC[4].length == 2);
				var Arg1 = get_arg(OC[4][0]);
				var Arg2 = get_arg(OC[4][1]);
				assert(OC[5].length == 2);
				assert(OC[5][0] == "fr");
				var DstRegNo = OC[5][1];
				if (Fop == "fdiv" && (Arg2 == 0 || Arg2 == 0.0)) {
					jumpf(OC[3]); // divsion by zero
				} else {
					switch (FOp) {
					case "fadd":
						FloatRegs[DstRegNo] = Arg1+Arg2;
						break;
					case "fsub":
						FloatRegs[DstRegNo] = Arg1-Arg2;
						break;
					case "fmul":
						FloatRegs[DstRegNo] = Arg1*Arg2;
						break;
					case "fdiv":
						FloatRegs[DstRegNo] = Arg1/Arg2;
						break;
					default:
						uns(OC);
					}
				}
				break;
			case "fnegate":
				assert(OC[4].length == 1);
				var Arg1 = get_arg(OC[4][0]);
				assert(OC[5].length == 2);
				assert(OC[5][0] == "fr");
				var DstRegNo = OC[5][1];
				FloatRegs[DstRegNo] = -Arg1;
				break;
			default:
				uns(OC);
			}
			break
	case "fconv":
		opcode_test(OC, 'fconv', 2);
			var SrcArg = get_arg(OC[1]);
			assert(OC[2].length == 2);
			assert(OC[2][0] == "fr");
			var DstFloatRegNo = OC[2][1];
			FloatRegs[DstFloatRegNo] = SrcArg; // cast to float
			break;
	case "fmove":
		opcode_test(OC, 'fmove', 2);
			var SrcArg = get_arg(OC[1]);
			assert(OC[2].length == 2);
			assert(OC[2][0] == "fr");
			var DstFloatRegNo = OC[2][1];
			FloatRegs[DstFloatRegNo] = SrcArg;
			break;
	case "fclearerror":
		opcode_test(OC, 'fclearerror', 0);
			FloatError = false;
			break;
	case "fcheckerror":
		opcode_test(OC, 'fcheckerror', 1);
			if (FloatError) {
				jumpf(OC[1]);
			}
			break;
	case "put_tuple":
		opcode_test(OC, 'put_tuple', 2);
			put_tuple_register = OC[2][1];
			var put_tuple_size = OC[1];
			put_tuple_i = 0;
			Regs[put_tuple_register] = new ETuple(put_tuple_size);
			break;
	case "put":
		opcode_test(OC, 'put', 1);
			var Arg = get_arg(OC[1]);
			if (put_tuple_i < 0 || put_tuple_register < 0) {
				alert("error in put");
			}
			// if (put_tuple_size < 0 || put_tuple_i >= put_tuple_size) {
			//	alert("error2 in put");
			//}
			Regs[put_tuple_register].put(put_tuple_i++, Arg);
			// TODO: if next instruction is not put, then reset put_tuple_* variables. Or is this legal to intermix put and other instructions?
			break;
	case "put_list":
		opcode_test(OC, 'put_list', 3);
			var Head = get_arg(OC[1]);
			var Tail = get_arg(OC[2]);
			assert(OC[3].length == 2);
			assert(OC[3][0] == "x");
			var DstRegNo = OC[3][1];
			Regs[DstRegNo] = new EList(Head, Tail);
			break;
	case "get_list":
		opcode_test(OC, 'get_list', 3);
			var Arg = get_arg(OC[1]);
			assert(OC[2].length == 2);
			var Head_DstRegNo = OC[2][1];
			assert(OC[3].length == 2);
			assert(OC[3][0] == "x");
			var Tail_DstRegNo = OC[3][1];
			if (OC[2][0] == "x") {
				Regs[Head_DstRegNo] = Arg.head();
			} else if (OC[2][0] == "y") {
				LocalRegs[Head_DstRegNo] = Arg.head();
			} else {
				throw "bad reg";
			}
			Regs[Tail_DstRegNo] = Arg.tail();
	case "make_fun2":
		opcode_test(OC, 'make_fun2', 4); // this make 'local' fun.
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
	case "case_end":
		opcode_test(OC, 'case_end', 1);
			var NotMatchedArg = OC[1];
			throw "case_end";
			break;
	case "badmatch":
		opcode_test(OC, 'badmatch', 1);
			var NotMatchedArg = OC[1];
			throw "badmatch";
			break;
	default:
			uns(OC);
			return;
	} // switch (opcode0)
	} // while (true)
}


function erljs_vm_call(Modules, StartFunctionSignature0, Args) {
	//console.time("main loop");
	//console.timeEnd("main loop");
	return erljs_vm_call_(Modules, StartFunctionSignature0, Args, 10000, 1);
}

