/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

// Inspired by base2 and Prototype
(function(){
var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;
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
    prototype[name] = typeof prop[name] == "function" && 
      typeof _super[name] == "function" && fnTest.test(prop[name]) ?
      (function(name, fn){
        return function() {
          var tmp = this._super;
          // Add a new ._super() method that is the same method
          // but on the super-class
          this._super = _super[name];
          // The method only need to be bound temporarily, so we
          // remove it when we're done executing
          var ret = fn.apply(this, arguments);
          this._super = tmp;
          return ret;
        };
      })(name, prop[name]) :
      prop[name];
  }
  // The dummy class constructor
  function Class() {
    // All construction is actually done in the init method
    if ( !initializing && this.init )
      this.init.apply(this, arguments);
  }
  // Populate our constructed prototype object
  Class.prototype = prototype;
  // Enforce the constructor to be what we expect
  Class.constructor = Class;
  // And make this class extendable
  Class.extend = arguments.callee;
  return Class;
};
})();


// term
var ETerm = Class.extend({
	type: function() { return "unknown"; },
	is: function(T) { return false; },
	toString: function() {
		throw "unknown eterm";
	}
});
var EAtom = ETerm.extend({
	init: function(Atom_) { this.AtomName = Atom_; },
	type: function() { return "atom"; },
	is: function(T) { return T=="atom"; },
	toString: function() {
		if (/a-z+/.test(this.AtomName)) {
			return this.AtomName;
		} else {
			throw "not implemented string for extended atoms";
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
	init: function(Arity_) { this.TupleArity = Arity_; this.TupleData = []; },
	type: function() { return "tuple"; },
	is: function(T) { return T=="tuple"; },
	put: function(Index, Value) { this.TupleData[Index] = Value; },
	get: function(Index) { return this.TupleData[Index]; },
	tuple_arity: function() { return this.TupleArity; },
	toString: function() {
		var r = "";
		for (var i = 0; i < this.TupleArity; i++) {
			if (i) r += ",";
			//r += this.TupleData[i].toString();
			r += this.TupleData[i];
		}
		return "{"+r+"}";
	}
});
var EList = ETerm.extend({
	init: function(Head_, Tail_) {
	//this.H = Head_; this.T = Tail_;
	this._=[Head_,Tail_];
	},
	type: function() { return "list"; },
	is: function(T) { return T=="list"; },
	empty: function() { return false; },
	head: function() {
	//return this.H;
	return this._[0];
	},
	tail: function() {
	//return this.T;
	return this._[1];
	},
	toString: function() {
		//if (this.head().is("integer") && (true)) {
		//} else {
		if (this.tail().is("list")) {
			return "["+this.head().toString()+this.tail().toStringJust()+"]";
		} else {
			return "["+this.head().toString()+"|"+this.tail().toString()+"]";
		}
	},
	toStringJust: function() {
		if (this.tail().is("list")) {
			return ","+this.head().toString()+this.tail().toStringJust();
		} else {
			return this.head().toString()+"|"+this.tail().toString();
		}
	},
	toStringLimited: function() {
		if (this.tail().is("list")) {
			return "["+this.head().toString()+","+this.tail().toStringLimited()+"]";
		} else {
			return this.toString();
		}
	}
});

var EListNil = ETerm.extend({
	init: function() { },
	type: function() { return "list"; },
	is: function(T) { return T=="list"; },
	empty: function() { return true; },
	toString: function() { return "[]"; },
	toStringJust: function() { return ""; }
});
var EFun = ETerm.extend({
	init: function(FunctionSignature_, BindedValues_, ID_) { this.FunctionSignature = FunctionSignature_; this.BindedValues = BindedValues_; this.ID = ID_; },
	type: function() { return "fun"; },
	is: function(T) { return T=="fun"; },
	toString: function() {
		return "#Fun<0.0."+this.FunctionSignature+"."+this.ID+">";
	},
	fun_arity: function() {
		return -1;
	},
});
var __refs_ids = 1;
var ERef = ETerm.extend({
	init: function() { this.refid = __refs_ids++; },
	type: function() { return "ref"; },
	is: function(T) { return T=="ref"; },
	toString: function() {
		return "#Ref<0.0."+this.refid+">";
	}
});

//var req = new XMLHttpRequest();
//req.overrideMimeType("text/plain");
//req.open("GET", "http://smp.if.uj.edu.pl/~baryluk/pobierz.php", false);
//R = req.send();

