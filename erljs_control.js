/* Copyritgh 2008 Witold Baryluk. Special thanks to Michal Kolarz, author of IL2JS freamwork */

function test(code) {
	return erljs_vm_call(code, 100);
}

function test_json(code) {
	var e = eval(code);  // not very good way. use prototype.js. some new browsers have native fast and safe JSON import/export.
	alert(e);
	return test(e);
}

function go() {
	var R;
	//R = erljs_vm_call(all_modules, ["example", "sum1", 1], [333]);
	//var R = erljs_vm_call(all_modules, ["example", "sum2", 2], [333,1000000]);
	//var R = erljs_vm_call(all_modules, ["example", "ntka", 2], [333,1000000]);
	//var R = erljs_vm_call(all_modules, ["example", "tailowa", 1], [1000000]);
	//var R = erljs_vm_call(all_modules, ["example", "nietailowa", 1], [1000000]);
	//var R = erljs_vm_call(all_modules, ["example", "konwencje1", 3], ["dupa","blada","masie"]);
	//var R = erljs_vm_call(all_modules, ["example", "konwencje2", 3], ["dupa","blada","masie"]);
	//var R = erljs_vm_call(all_modules, ["example", "konwencje3", 3], ["dupa","blada","masie"]);
	//var R = erljs_vm_call(all_modules, ["example", "konwencje4", 3], ["dupa","blada","masie"]);
	//var R = erljs_vm_call(all_modules, ["example", "matche", 1], ["a"]);
	R = erljs_vm_call(all_modules, ["example", "silnia", 1], [20]);
	//R = erljs_vm_call(all_modules, ["example", "jss", 1], [20]);
	//R = erljs_vm_call(all_modules, ["example", "llll", 1], [20]);

	//R = erljs_vm_call(all_modules, ["lists", "seq", 3], [10,30,2]);
	//R = erljs_vm_call(all_modules, ["example", "llll3", 2], [133,44]);
	//R = erljs_vm_call(all_modules, ["example", "llll_z", 1], [33]);
	//R = erljs_vm_call(all_modules, ["example", "llll_u", 1], [33]);

	//alert("Returned: "+Object.toJSON(R));
	document.getElementById('codeform').innerText = "Result: "+R.toString(); //Object.toJSON(R);
}

