/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

/*
function test(code) {
	return erljs_vm_call(code, 100);
}

function test_json(code) {
	var e = eval(code);  // not very good way. use prototype.js. some new browsers have native fast and safe JSON import/export.
	alert(e);
	return test(e);
}
*/

function erl(X) {
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
		return erljs_vm_call(all_modules, [m[1], m[2], A], args);
	} else {
		throw "bad syntax: " + X;
	}
};

function erlgo(X) {
	var R;
	try {
		R = erl(X);
	} catch(err) {
		R = "Error: "+err;
	}
	document.getElementById('codeform').innerText = R.toString(); //Object.toJSON(R);
	return false;
}

function go() {
	var R;
	R = erl("example:sum1(333)");
	R = erl("example:sum2(333,1000000)");
	R = erl("example:ntka(333,1000000)");
	R = erl("example:tailowa(1000000)");
	R = erl("example:nietailowa(1000000)");
	//R = erl("example:konwencje1('dupa','blada','masie')");
	//R = erl("example:konwencje2('dupa','blada','masie')");
	//R = erl("example:konwencje3('dupa','blada','masie')");
	//R = erl("example:konwencje4('dupa','blada','masie')");
	//R = erl("example:matche('a')");
	R = erl("example:silnia(20)");
	R = erl("example:jss(20)");
	R = erl("example:llll(20)");

	R = erl("lists:seq(10,30,2)");
	R = erl("example:llll3(10,14)");
	R = erl("example:llll_z(33)");
	R = erl("example:llll_u(33)");

	R = erl("example:fib1(10)");
	R = erl("example:fib2(10)");

	//alert("Returned: "+Object.toJSON(R));
	document.getElementById('codeform').innerText = "Result: "+R.toString(); //Object.toJSON(R);
}

function unittest__term_decode(){
function d2(x,d2) {
	var e = eterm_decode(x);
	//debug(Object.toJSON(e));
	var o = (d2==e.toString());
	debug(x+" INPUT");
	if (!o) {
	debug(e+" OUTPUT");
	debug(d2+" EXPECTED")
	}
	debug((o ? "OK" : "FAIL FAIL FAIL"));
	if (!o) throw "FAIL in decoding";
}
function d(x) {
	d2(x,x);
}

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

d("[123,321,512]");
d("[123,321|-512]");

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
}


function erljs_init() {
	erljs_vm_init(all_modules);
	unittest__term_decode();
}
