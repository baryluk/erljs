/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

/*
function test(code) {
	return erljs_vm_call(code, 100);
}

function test_json(code) {
	// not very good way. use prototype.js. some new browsers have native fast and safe JSON import/export.
	var e = eval(code);
	alert(e);
	return test(e);
}
*/

function erl(X, ShowInput) {
	var r = /^\s*([^:]+):([^(]+)\((.*)\)\.?\s*$/;
	var m = r.exec(X);
	if (m) {
/*
		var args = m[3].length==0 ? [] : m[3].split(/,/);
		var arity = args.length;
		for (var i = 0; i < arity; i++) {
			args[i] = new Number(args[i]);
		}
*/

		var args = [];
		var A = 0;
		if (m[3].length) {
			var i = 0;
			var a = get_next(m[3],i,false);
			args[A++]=a[0];
			i=a[1];
			while (m[3][i] == ",") {
				i++;
				var a = get_next(m[3],i,false);
				args[A++]=a[0];
				i=a[1];
			}
			if (i != m[3].length) throw "bad syntax in arguments list";
		}
		if (ShowInput) {
		debug("erljs VM call: "+X);
		}
		return erljs_vm_call(all_modules, [m[1], m[2], A], args);
	} else {
		throw "bad syntax: " + X;
	}
};

function erlgo(X, ShowResult) {
	var R,RR;
	var no_exp = false;
	try {
		R = erl(X);
		RR = R.toString();
		no_exp = true;
	} catch(err) {
		RR = "Error: "+err;
		R = err;
	}
	if (ShowResult) {
	debug("Result: "+RR);
	}
	try {
		document.getElementById('codeform').innerText = RR;
//		debug("---");
	} catch (e) { ; }; // Rhino
	if (no_exp) {
		return RR;
	} else {
		throw R;
	}
}

function debughfail(x) {
	try {
	if (document) {
	debugh("<div style='background-color: #880000;'>"+x+"</div>");
	}
	} catch (e) {
		try {
			print(x);
		} catch (e2) { };
	}
}

function debughok(x) {
	try {
	if (document) {
	debugh("<div style='background-color: #004400;'>"+x+"</div>");
	}
	} catch (e) {
		try {
			print(x);
		} catch (e2) { };
	}
}

var _unittest_fail = 0,
	_unittest_ok = 0;

function unittest_clear() {
	_unittest_fail = 0;
	_unittest_ok = 0;
}

function unittest_stats() {
	return {ok: _unittest_ok, fail: _unittest_fail};
}

var eq_hide_green = true;

function eq(Input,Expected,OriginalCodeForWrapper) {
	_unittest_fail++;
	var failed = true;
	var ShowAs = Input + (OriginalCodeForWrapper ? " (wrapper for "+OriginalCodeForWrapper +")" : "");
	var Output;
	try {
		Output = erlgo(Input);
		failed = false;
	} catch (err) {
		failed = true;
	}
	if (failed === false) {
		if (Expected !== undefined) {
			if (Output != Expected) {
				debugh("Input  ="+Input);
				if (OriginalCodeForWrapper) {
				debugh("Code    ="+OriginalCodeForWrapper);
				}
				debugh("Output  ="+Output);
				debugh("Expected="+Expected);
				debughfail(ShowAs + " not evaluated to expected " + Expected);
				debughfail(ShowAs + " evaluated insted to " + Output);
				debugh("<hr/>");
			} else {
				if (!eq_hide_green) {
					debughok(ShowAs + " evaluated to expected " + Expected);
				}
				_unittest_fail--;
				_unittest_ok++;
			}
		} else {
			if (!eq_hide_green) {
				debughok(ShowAs + " executed without error");
			}
			_unittest_fail--;
			_unittest_ok++;
		}
	} else {
		debughfail(ShowAs + " executed with exception");
		debugh("<hr/>");
	}
}


function unittest__run_examples() {
	eq("example:sum1(333)");
	eq("example:sum2(333,1000000)");
	eq("example:ntka(333,1000000)");
	eq("example:tailowa(1000000)");
	eq("example:nietailowa(1000000)");
	//eq("example:konwencje1('dupa','blada','masie')");
	//eq("example:konwencje2('dupa','blada','masie')");
	//eq("example:konwencje3('dupa','blada','masie')");
	//eq("example:konwencje4('dupa','blada','masie')");
	//eq("example:matche('a')");
	eq("example:silnia(20)");
	eq("example:llll(20)");

	eq("lists:seq(10,30,2)","[10,12,14,16,18,20,22,24,26,28,30]");
	eq("example:llll2(10)","{10,[]}");
	eq("example:llll3(10,14)");
	eq("example:llll_z(33)");
	eq("example:llll_u(33)");

	eq("example:fib1(12)",144);
	eq("example:fib2(12)",144);
	eq("example:fib3(12)",144);
	eq("example:fib2(60)",1548008755920);
	eq("example:fib3(60)",1548008755920);

	eq("example:dd1(10,20,30,40)");
	eq("example:dd2(10,20)");
	eq("example:dd3(10,20,30,40)");
	eq("example:dd4()");
	eq("example:dd5()");
	eq("example:dd6()");
	eq("example:dd7()");
	eq("example:dd8(10,200)");
	eq("example:dd9(30)");
	eq("example:dd10(30)");
	eq("example:dd11(30)");
	eq("example:dd12(30)");
	eq("example:dd13(11,30)");
	eq("example:dd14(11,30)");


	eq("example:jss(20)");
	//eq("example:jss2(33)");
	//eq("example:jss3([23,ab,{34,55}])");
}


function unittest__term_decode(T1,T2){
function d2(x,d2) {
	try {
	_unittest_fail++;
	var e = eterm_decode(x);
	var o = (d2==e.toString());
	if (!o) {
	debughfail("FAIL INPUT:  "+x);
	debughfail("FAIL OUTPUT: "+e);
	debughfail("FAIL EXPECT: "+d2);
	debughfail("FAIL         ^^^...");
	throw "No match beetween OUPUT and EXPECT.";
	} else {
		debughok("OK   INPUT:  "+x);
		_unittest_fail--;
		_unittest_ok++;
	}
	} catch (err) {
	debugh("FAIL INPUT:  "+x);
	debugh("Exception in decoding: "+err);
	}
}
function d(x) {
	d2(x,x);
}

if (T1) {

d("{}");
d("{{}}");
d("{{{}}}");
d("{{},{}}");
d("{{},{},{}}");
d("[]");
d("[[]]");
d("[[[]]]");
d("[[],[]]");
d("[[],[],[]]");

d("[{}]");
d("{[]}");
d("[{[]}]");
d("{[{}]}");
d("[{},{}]");
d("{[],[]}");
d("[{},{},{}]");
d("{[],[],[]}");

d("[[],{}]");
d("[{},[]]");
d("{[],{}}");
d("{{},[]}");

d("[{}|{}]");

d2("[{}|[]]", "[{}]");
d2("[{}|[{}|[]]]", "[{},{}]");
d2("[{}|[{}|[{}]]]", "[{},{},{}]");

d("[123,321,512]");
d("[123,321,-512]");
d("[123,321|-512]");
d("[123,321,512]");
d2("[123,321|[512]]","[123,321,512]");

d("123");
d("12.3");
d("0.3");
d("-0.3");
d2("011.3e-23", "1.13e-22");
d2("+123", "123");
d("-123");
d("-123.0312");
d2("{-123,0.1,12,2,1,31,2,000031,23,0.001,3.0,12013.033,5,6.0e+00021,1,78,8,213123,4,12,3,12323}",
	"{-123,0.1,12,2,1,31,2,31,23,0.001,3,12013.033,5,6e+21,1,78,8,213123,4,12,3,12323}");
d("{20,1,2,1,[2,12,3],{[2,3],[3|4]}}");
d("[20,1,2,1,[2,12,3]|{[2,3],[3|4]}]");

d("ala");
d("{ala}");
d("{ala,ma,10,kotow}");
d("[20.3,nasza,{ala,ma},kota]");
d("[20.3,nasza,{ala,ma},{malego,0.5},kota]");


}

// many tests bellow will fail becuase missing unescaping in decoder.
// becuase of this they are now commented

if (T2) {
//d2(".a","a");

//d("'ala ALA MA`1234567890 -=`~!@#$%^&*()-=_+{}[]:bz<>?,./|    \\\\\\b\\t\\n\\e\\r\\v\\f\\'\\\" \" '");
//d("'ala ALA MA`1234567890 -=`~!@#$%^&*()-=_+{}[]:bz<>?,./|     \\ \\b\\t\\n\\e\\r\\v\\f\\'\\\" \" '");
d2("'a'","a");
d("'.a'");
   // d("'\\'"); % illegal
//d2("'\\ '","' '");
//d("'\\\\'");
//d("'\\b'");
//d2("'\\012'","'\\n'");
//d2("'\\a'","a");
//d("'\"'");
//d("'\\''");
//d2("'\\0'","'\\000'");
//d2("'\\9'","'9'");
//d2("'\\123'","'S'");
//d2("'\\100'","'@'");
//d2("'\\151'","i");
//d2("'\\16'","'\\016'");
//d2("'\\12'","'\\n'");
//d2("'\\33'","'\\e'");
//d("'\\035'");
//d2("'\\377'","ÿ");
   //    17 d("'\\444'"); // illegal
//d("'\\42a22'","\"a22"); // ok
   //    18 d("'\\777'"); // illegal
   //    18 d("'ą'");  // illegal
//d2("'\\77a7'","'?a7'");
//d2("'\\99'","'99'");
   //    20 d("'\\888'"); // illegal
   //    21 d("'\\x'");   // illegal
//d2("'\\x4f'","'0'");
   //    23 d("'\\x4'");  // illegal
//d2("'\\x41g'","'Ag'");
//d2("'\\x44ff'","'Dff'");
d("'...'");
d("'.@.'");
//d2("'.@\\\"\\'@@\"@.'","'.@\"\\'@@\"@.'");
d("'.'");
d("'?'");
d("'*'");
d("'$'");
//d2("'\\$'","'$'");

}

}



function erljs_init() {
	erljs_vm_init(all_modules);
}

function erljs_unittests() {
	unittest_clear();
	//unittest__term_decode(true,true);
	//unittest__run_examples();
	unittest__tests_auto();
	var stats = unittest_stats();
	debugh("==================================");
	debugh("unittests summary:");
	debughok(stats.ok + " tests passed");
	(stats.fail != 0 ? debughfail : debughok)
		(stats.fail + " tests failed");
	debugh("==================================");

	if (stats.fail != 0) {
		alert(stats.fail + " tests failed");
	}
}

