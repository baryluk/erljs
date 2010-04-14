/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

function test(code) {
	return erljs_vm_call(code, 100);
}

function test_json(code) {
	var e = eval(code);  // not very good way. use prototype.js. some new browsers have native fast and safe JSON import/export.
	alert(e);
	return test(e);
}




function erl(X) {
	var r = /^([^:]+):([^(]+)\((.*)\)$/;
	var m = r.exec(X);
	if (m) {
		var args = m[3].length==0 ? [] : m[3].split(/,/);
		var arity = args.length;
		for (var i = 0; i < arity; i++) {
			args[i] = new Number(args[i]);
		}
		return erljs_vm_call(all_modules, [m[1], m[2], arity], args);
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

