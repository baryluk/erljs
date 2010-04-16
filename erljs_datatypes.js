/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

// Inspired by base2 and Prototype
// http://ejohn.org/blog/simple-javascript-inheritance/
(function(){
var initializing = false, fnTest = /xyz/.test(function(xyz){xyz("xyz");}) ? /\b_super\b/ : /.*/;
// The base Class implementation (does nothing)
this.Class = function(){};
// Create a new Class that inherits from this class
Class.extend = function(prop) {
	var _super = this.prototype;
	// Instantiate a base class (but only create the instance,
	// don't run the init constructor)
	initializing = true;
	var prototype = new this();
	initializing = false;
	// Copy the properties over onto the new prototype
	for (var name in prop) {
		// Check if we're overwriting an existing function
		prototype[name] = typeof prop[name] == "function" && typeof _super[name] == "function" && fnTest.test(prop[name])
				? (function(name, fn){
					return function() {
						var tmp = this._super;
						// Add a new ._super() method that is the same method but on the super-class
						this._super = _super[name];
						// The method only need to be bound temporarily, so we remove it when we're done executing
						var ret = fn.apply(this, arguments);
						this._super = tmp;
						return ret;
					};
				})(name, prop[name])
				: prop[name];
	}
	// The dummy class constructor
	function Class() {
		// All construction is actually done in the init method
		if (!initializing && this.init) {
			this.init.apply(this, arguments);
		}
	}
	// Populate our constructed prototype object
	Class.prototype = prototype;
	// Enforce the constructor to be what we expect
	Class.constructor = Class;
	// And make this class extendable
	Class.extend = arguments.callee;
	return Class;
}; // Class.extend
})();

// Erlang type system
var ETerm = Class.extend({
	type: function() { return "unknown"; },
	is: function(T) { return false; },
	toString: function() {
		throw "unknown eterm";
	}
});

var AllAtomsToInt = {};
var AllAtomsFromInt = {};
var AllAtomsMaxId = 1;

var EAtom = ETerm.extend({
	init: function(Atom_) {
		// TODO: perform validation of atom value, double dot, trailing dot, single quotas, lowercase first letter.

		if (Atom_ in AllAtomsToInt) {
			this.A = AllAtomsToInt[Atom_];
		} else {
			this.A = (AllAtomsMaxId++);
			AllAtomsToInt[Atom_] = this.A;
			AllAtomsToInt[this.A] = Atom_;
		}
	},
	type: function() { return "atom"; },
	is: function(T) { return T=="atom"; },
	atom_id: function() { return this.A; },
	atom_name: function() { return AllAtomsFromInt[this.A]; },
	toString: function() {
		var a = AllAtomsFromInt[this.A];
		if (/^[a-z][a-zA-Z_0-9]*$/.test(a)) {
			return a;
		//} else if (/^[a-z](\.[a-zA-Z_0-9]+)*\.?$/.test(a)) { // we are allowed to display few other atoms directly (with single dots inside),
		//	return a;                                          // but we will not as EVM doesnt do so.
//		} else if (a.indexOf("'")<0) { // not needed special case of else below.
//			return "'"+a+"'";
		} else {
			return "'"+a.replace("'","\\'")+"'";
		}
	}
});
var EInteger = ETerm.extend({
	init: function(Integer_) { this.IntegerValue = Integer_ },
	type: function() { return "integer"; },
	is: function(T) { return T=="integer"; },
	toString: function() {
		return this.IntegerValue; // be sure to include decimal dot
	}
});
var EFloat = ETerm.extend({
	init: function(Float_) { this.FloatValue = Float_ },
	type: function() { return "float"; },
	is: function(T) { return T=="float"; },
	toString: function() {
		return this.FloatValue; // be sure to include decimal dot
	}
});
var ETuple = ETerm.extend({
	init: function(X) { if (X instanceof Array) { this.TupleArity=X.length; this.TupleData=X; } else { this.TupleArity=X; this.TupleData=[]; } },
	type: function() { return "tuple"; },
	is: function(T) { return T=="tuple"; },
	put: function(Index, Value) { this.TupleData[Index] = Value; },
	get: function(Index) { if (Index>this.TupleArity) throw ""; return this.TupleData[Index];  },
	tuple_arity: function() { return this.TupleArity; },
	toString: function() {
		var r = "";
		for (var i = 0; i < this.TupleArity; i++) {
			if (i) r += ",";
			r += this.TupleData[i].toString();
			//r += this.TupleData[i];
		}
		return "{"+r+"}";
	}
});

var EListAny = ETerm.extend({init: function() {}});

var EList = EListAny.extend({
	init: function(Head_, Tail_) {
	//this.H = Head_; this.T = Tail_;
	this._=[Head_,Tail_];
	},
	type: function() { return "list"; },
	is: function(T) { return T=="list"; },
	empty: function() { return false; },
	head: function() {
		return this._[0];
	},
	tail: function() {
		//return this.T;
		return this._[1];
	},
	sethead:function(h) {
		this._[0]=h;
	},
	settail:function(t) {
		this._[1]=t;
	},
	toString: function() { // make this function tail recursive and with accumulator
		//if (this.head().is("integer") && (true)) {
		//} else {
		var t = this.tail();
		if (t instanceof EListAny) {
			return "["+this.head().toString()+t.toStringJust()+"]";
		} else {
			return "["+this.head().toString()+"|"+t.toString()+"]";
		}
	},
	toStringJust: function() { // make this function tail recursive and with accumulator
		var t = this.tail();
		if (t instanceof EListAny) {
			return ","+this.head().toString()+t.toStringJust();
		} else {
			return ","+this.head().toString()+"|"+t.toString();
		}
	},
	toStringLimited: function() { // make this function tail recursive, and pretest
		var t = this.tail();
		if (t instanceof EListAny) {
			return "["+this.head().toString()+","+t.toStringLimited()+"]";
		} else {
			return this.toString();
		}
	},
	length: function() { return list_len(this); }
});

function list_len(t) {
	var l = 0;
	while (t instanceof EList) {
		t = t.tail();
		l++;
	}
	return l;
}

// it is not a EList!
var EListNil = EListAny.extend({
	init: function() { },
	type: function() { return "list"; },
	is: function(T) { return T=="list"; },
	empty: function() { return true; },
	toString: function() { return "[]"; },
	toStringJust: function() { return ""; },
	length: function() { return 0; }
});

// slightly more efficient representation and lazy tail
var EListString = EListAny.extend({
	init: function(S_, i_) { this.S = S_; this.i=i_; },
	type: function() { return "list"; },
	is: function(T) { return T=="list"; },
	empty: function() { return this.S.length==this.i; },
	head: function() { return this.S[this.i]; },
	tail: function() {
/*
		if (!this.tailmem) { // memoize
			this.tailmem = new EListString(this.S,this.i+1);
		}
		return this.tailmem;
*/
		return new EListString(this.S,this.i+1);;
	},
	toString: function() { return "\"" +this.S.replace(/"/g, "\\\"")+ "\""; },
	toStringJust: function() { return "|\"" +this.S.replace(/"/g, "\\\"")+ "\""; },
	length: function() { return this.S.length-this.i; }
});

var EFun = ETerm.extend({
	init: function(M_, FunF_, FunA_, EnvA, ID_, Env_, Pid_) { // module, fun name in module, fun arity (for call), env arity (for makeing), uniq id, binded values for make
		assert(Env_.length == A2);
		this.M = M__;
		this.FunF = FunF_;   // it is normally "-"+FunctionNameInWhichItIsDefined+"/"+ArityOfFunctionInWhichItIsDefined+"-fun-"+IndexNumberOfFunInThisFunction
		this.FunA = FunA_; // arity of fun. what is number of arguments needed to be provided be caller in call_fun?
		this.Index = Index_; // it is index of the fun as the funs in the whole module. runtime can store them in some separate table
		this.Uniq = Uniq_; // used to detect module reloading, and call proper (possibly old) module.
		this.Pid = Pid_; // which pid created this fun (so it can reference it's data).
	},
	type: function() { return "fun"; },
	is: function(T) { return T=="fun"; },
	toString: function() {
		return "#Fun<"+this.M+"."+this.Uniq+"."+this.Index+">"; // TODO, remember about dots in atoms!
	},
	function_arity: function() { // arity of function M:FunF whichi implements this fun. it have Env + actuall parameters.
		return FunA+Env.length;
	},
	fun_arity: function() { // actuall paramater number needed for calling
		return A;
	},
	fun_type: function() { return "local"; }
});
var EFunExternal = EFun.extend({
	init: function(M_,F_,A_) { this.M=M_; this.F=F_; this.A=A_; },
	fun_type: function() { return "external"; },
	toString: function() {
		return "#Fun<"+M+"."+F+"."+A+">"; // TODO, remember about dots in atoms!
	},
	function_arity: function() {
		return A;
	},
	fun_arity: function() {
		return A;
	}
});

// we do not need to support fun M/A, because it is done using helper some helper function.

var __refs_ids = 1;
var ERef = ETerm.extend({
	init: function() { this.refid = __refs_ids++; },
	type: function() { return "ref"; },
	is: function(T) { return T=="ref"; },
	toString: function() {
		return "#Ref<0.0."+this.refid+">";
	}
});


/** mini parser of erlang data terms (literals)
 *
 * No pid,port,fun,ref or any expressions allowed.
 *
 * (N - not implemented)
 *   decimal integers:   1, -5, 0, 1412, +33 // arbitrary precisions
 *N    2#1010101,  binary numbers
 *N    16#112b12a121a, base 16, etc.
 *N    $a  - ascii code for a.
 *N    $Ł  - unicode code pint for Ł
 *   float  1.0e309, 0.412, 4.12e-55
 *   atoms:  abc, // lowercas first latter, then letters, _, numbers. no two consecutive dots allowed or even single at the end. single dot at begining is ignored, two are not allowed.
 *           'ABA$a', // with escaping ' using \'. dots in any number allowed everywhere.
 *   empty tuple: {}
 *   one tuple: {a}
 *   two tuple: {a,b}
 *   empty list: []
 *   one element list: [a]
 *   many element lists:    [a,b,c,d]
 *   inproper lists:  [a,b,c|d]
 *   string:   "xyz"  // and escaping rules
 *N  binaries and bitstrings.  <<1:8,2,3/unsigned,123,123/integer>>,<<"asdasd">>.
 *
 * Note: remember that if some atoms doesn't exists yet, it will be added to the global hash table
 *       if you have some untrusted source of atoms, or they are automatically generated,
 *       this table can grow to arbitrary large sizes. Use "existing" flag/version to only allow existing atoms.
 *
 * TODO: Add Pid/Port/Fun/Ref serialization. Pid and Ref probably first.
 * TODO: Add bitstrings and binaries when erljs will have binaries support. Bitstrings are simpler, so first.
 *
 * Note: beyond the fact that it only handles some data types, no expressions are allowed.
 *       Even things like this  {(2)}, is not allowed as "(...)" is expression not literal.
 *
 * Note: This procedure is not Unicode-aware.
 *
 * See Also: also http://www.erlang.org/eeps/eep-0018.html
 * http://www.erlang.org/eeps/eep-0021.html
*/
function eterm_decode(s) {
	return eterm_decode_(s, false);
}
function eterm_decode_existing_atoms(s) {
	return eterm_decode_(s, true);
}
function eterm_decode_(s,existing) {
	var t = get_next(s,0,existing);
	if (t[1] != s.length) throw "excesive data";
	return t[0];
}

function get_next(s,i,existing) {
	switch (s[i++]) {
		case "{":
			if (s[i] == "}") return [new ETuple(0),i+1];
			var k = new Array();
			var n = 0;
tuple_loop:
			while (true) {
				var t = get_next(s, i, existing);
				k[n++]=t[0];
				i=t[1];
				switch (s[i++]) {
					case ",":
						continue tuple_loop; // TODO: allow trailing comma as proposed in EEP
					case "}":
						break tuple_loop;
					default:
						throw "syntax error in tuple at "+i;
				}
			}
			return [new ETuple(k),i];
		case "[":
			if (s[i] == "]") return [new EListNil(),i+1];
			var proper = true;
			var r0 = new EList(-1233,-4123), r = r0;
list_loop:
			while (true) {
				var t = get_next(s, i, existing);
				var r2 = new EList(t[0],-142);
				r.settail(r2);
				r = r2;
				i=t[1];
				switch (s[i++]) {
					case ",": // TODO: allow trailing comma in proper lists as proposed in EEP
						continue list_loop;
					case "|":
						proper=false;
					case "]":
						break list_loop;
					default:
						throw "syntax error in list at "+i;
				}
			}
			if (proper) {
				r.settail(new EListNil);
			} else {
				var t = get_next(s, i, existing);
				r.settail(t[0]);
				i=t[1];
				if (s[i++] != "]") throw "bad list";
			}
			return [r0.tail(),i];
		case "\"":
			throw "string";
		case "'":
			return get_next_atom(s,i,existing);
		default:
			if (/^a-z$/.test(s[i-1])) {
				return get_next_atom(s,i,existing);
			}
			if (/^[0-9\-+]$/.test(s[i-1])) {
				var m,
					// we need /g for lastIndex, then verify if it was anchored correctly.
					// we are using this so we do not need to use substr which can lead to O(n^2) parsing of things like [0,0,0,0,...,0,0,0,0]
					// well, it can still be O(n).
					// TODO: Merge both into single regexp
					rfi = /(([\-+]?\d+)|([\-+]?\d+\.\d+([eE]([\-+]?\d+))?))/g,

					ri = /([\-+]?\d+)/g,
					// Floats: dot is mandatory (even with "e" syntax).
					//   some digits before AND after dot is also mandatory.
					//   0.000...........00001e1000  is ok.
					rf = /[\-+]?\d+\.\d+([eE]([\-+]?\d+))?/g;

				rfi.lastIndex = i-1;
				m = rfi.exec(s);
				if (!m) {
					throw "error 1";
				}
				if (m.index!=i-1) {
					throw "error 2";
				}

				rf.lastIndex = i-1;
				if (m = rf.exec(s)) {
					//assert(rr.leftContext.length == 0); // not available in Opera and Safari
					// we need to check this anchoring, because this should not be accepted:
					// --2.0 (will return -2.0) or 12abc4.56  (will return 4.56). but both are invalid literals.
					if(m.index == i-1) {
						// Note: parseFloat accepts NaN, Infinity, -Infinity, -0.0
						//  one can construct x=-0.0, but it is dispayed everywhere as 0
						//  it is -0.0 becuase 1.0/x creates -Infinity.
						var x = parseFloat(m[0]);
						if (x==Infinity || x==-Infinity || isNaN(x)) throw "bad float";
						return [x, rf.lastIndex];
					} // or try integer matching
				}

				// TODO: 16#abd51abf, and other bases notation.

				ri.lastIndex = i-1;
				if (m = ri.exec(s)) {
					if (m.index != i-1) {
//alert("i="+i+" m.index="+m.index+" m="+Object.toJSON(m));
 throw "error 4"; }
					// in JavaScript parseInt, prefixed 0 assumes that it is octal (base8), so we force base 10
					// or we could use this regexp: /^([\-+]?)0*(0|[1-9]\d*)/  with m[2] as leading-0-free string, but then we will need check sign or append it
					return [parseInt(m[0], 10), ri.lastIndex];
					// Note: parseInt accepts 0x, or 0 prefix, for 16 and 8 bases
				}

				throw "internal error 5";
			}

			throw "syntax error at "+i;
	}
}

//var req = new XMLHttpRequest();
//req.overrideMimeType("text/plain");
//req.open("GET", "http://smp.if.uj.edu.pl/~baryluk/pobierz.php", false);
//R = req.send();

