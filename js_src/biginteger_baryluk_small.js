/*
	JavaScript BigInteger library version 0.9
	http://silentmatt.com/biginteger/

	Copyright (c) 2009 Matthew Crumley <email@matthewcrumley.com>
	Licensed under the MIT license.
*/

/*
	Class: BigInteger
	An arbitrarily-large integer.

	<BigInteger> objects should be considered immutable. None of the "built-in"
	methods modify *this* or their arguments. All properties should be
	considered private.

	All the methods of <BigInteger> instances can be called "statically". The
	static versions are convenient if you don't already have a <BigInteger>
	object.

	As an example, these calls are equivalent.

	> BigInteger(4).multiply(5); // returns BigIngeger(20);
	> BigInteger.multiply(4, 5); // returns BigInteger(20);

	> var a = 42;
	> var a = BigInteger.toJSValue("0b101010"); // Not completely useless...
*/

// IE doesn't support Array.prototype.map
if (!Array.prototype.map) {
	Array.prototype.map = function(fun /*, thisp*/) {
		var len = this.length >>> 0;
		if (typeof fun !== "function") {
			throw new TypeError();
		}
		var res = new Array(len);
		var thisp = arguments[1];
		for (var i = 0; i < len; i++) {
			if (i in this) {
				res[i] = fun.call(thisp, this[i], i, this);
			}
		}
		return res;
	};
}

/*
	Constructor: BigInteger()
	Convert a value to a <BigInteger>.

	Although <BigInteger()> is the constructor for <BigInteger> objects, it is
	best not to call it as a constructor. If *n* is a <BigInteger> object, it is
	simply returned as-is. Otherwise, <BigInteger()> is equivalent to <parse>
	without a radix argument.

	> var n0 = BigInteger();      // Same as <BigInteger.ZERO>
	> var n1 = BigInteger("123"); // Create a new <BigInteger> with value 123
	> var n2 = BigInteger(123);   // Create a new <BigInteger> with value 123
	> var n3 = BigInteger(n2);    // Return n2, unchanged

	The constructor form only takes an array and a sign. *n* must be an array of
	numbers in little-endian order, where each digit is between 0 and 9
	inclusive. A second parameter sets the sign: -1 for negative, +1 for
	positive, or 0 for zero. The array is *not copied and may be modified*. If
	the array contains only zeros, the sign parameter is ignored and is forced
	to zero.

	> new BigInteger([3,2,1], -1): create a new BigInteger with value -123

	Parameters:

		n - Value to convert to a <BigInteger>.

	Returns:

		A <BigInteger> value.
*/
function BigInteger(n, s) {
	if (!(this instanceof BigInteger)) {
		if (n instanceof BigInteger) {
			return n;
		}
		else if (typeof n === "undefined") {
			return BigInteger.ZERO;
		}
		return BigInteger.parse(n);
	}

	while (n.length && !n[n.length - 1]) {
		--n.length;
	}
	this._d = n;
	this._s = n.length ? (s || 1) : 0;
}

// Constant: ZERO // <BigInteger> 0.
BigInteger.ZERO = new BigInteger([], 0);
// Constant: ONE // <BigInteger> 1.
BigInteger.ONE = new BigInteger([1], 1);
// Constant: M_ONE // <BigInteger> -1.
BigInteger.M_ONE = new BigInteger([1], -1);

/*
	Constant: small
	Array of <BigIntegers> from 0 to 36.

	These are used internally for parsing, but useful when you need a "small"
	<BigInteger>.
*/
BigInteger.small = [
	BigInteger.ZERO,
	BigInteger.ONE,
	new BigInteger(  [2], 1),
	new BigInteger(  [3], 1),
	new BigInteger(  [4], 1),
	new BigInteger(  [5], 1),
	new BigInteger(  [6], 1),
	new BigInteger(  [7], 1),
	new BigInteger(  [8], 1),
	new BigInteger(  [9], 1),
	new BigInteger([0,1], 1),
	new BigInteger([1,1], 1),
	new BigInteger([2,1], 1),
	new BigInteger([3,1], 1),
	new BigInteger([4,1], 1),
	new BigInteger([5,1], 1),
	new BigInteger([6,1], 1),
	new BigInteger([7,1], 1),
	new BigInteger([8,1], 1),
	new BigInteger([9,1], 1),
	new BigInteger([0,2], 1),
	new BigInteger([1,2], 1),
	new BigInteger([2,2], 1),
	new BigInteger([3,2], 1),
	new BigInteger([4,2], 1),
	new BigInteger([5,2], 1),
	new BigInteger([6,2], 1),
	new BigInteger([7,2], 1),
	new BigInteger([8,2], 1),
	new BigInteger([9,2], 1),
	new BigInteger([0,3], 1),
	new BigInteger([1,3], 1),
	new BigInteger([2,3], 1),
	new BigInteger([3,3], 1),
	new BigInteger([4,3], 1),
	new BigInteger([5,3], 1),
	new BigInteger([6,3], 1)
];

// Used for parsing/radix conversion
BigInteger.digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

/*
	Method: toString
	Convert a <BigInteger> to a string.
	When *base* is greater than 10, letters are upper case.
	Parameters:
		base - Optional base to represent the number in (default is base 10).
		       Must be between 2 and 36 inclusive, or an Error will be thrown.
	Returns:
		The string representation of the <BigInteger>.
*/
BigInteger.prototype.toString = function(base) {
	base = +base || 10;
	if (base < 2 || base > 36) {
		throw new Error("illegal radix " + base + ".");
	}
	if (this._s === 0) {
		return "0";
	}
	if (base === 10) {
		// [].reverse() modifies the array, so we need to copy if first
		return (this._s < 0 ? "-" : "") + (this._d.slice().reverse().join("") || "0");
	}
	else {
		var numerals = BigInteger.digits;
		base = BigInteger(base);
		var sign = this._s;

		var n = this.abs();
		var digits = [];
		var digit;

		while (n._s !== 0) {
			var divmod = n.divRem(base);
			n = divmod[0];
			digit = divmod[1];
			// TODO: This could be changed to unshift instead of reversing at the end.
			// Benchmark both to compare speeds.
			digits.push(numerals[digit]);
		}
		return (sign < 0 ? "-" : "") + digits.reverse().join("");
	}
};

// Verify strings for parsing
// my micro benchmarks doesn't show difference beetwen [0-9a-zA-Z] and [0-9a-z]/i
BigInteger.radixRegex = [
	/^$/,
	/^$/,
	/^[01]*$/,
	/^[012]*$/,
	/^[0-3]*$/,
	/^[0-4]*$/,
	/^[0-5]*$/,
	/^[0-6]*$/,
	/^[0-7]*$/,
	/^[0-8]*$/,
	/^[0-9]*$/,
	/^[0-9a]*$/i,
	/^[0-9ab]*$/i,
	/^[0-9abc]*$/i,
	/^[0-9a-d]*$/i,
	/^[0-9a-e]*$/i,
	/^[0-9a-f]*$/i,
	/^[0-9a-g]*$/i,
	/^[0-9a-h]*$/i,
	/^[0-9a-i]*$/i,
	/^[0-9a-j]*$/i,
	/^[0-9a-k]*$/i,
	/^[0-9a-l]*$/i,
	/^[0-9a-m]*$/i,
	/^[0-9a-n]*$/i,
	/^[0-9a-o]*$/i,
	/^[0-9a-p]*$/i,
	/^[0-9a-q]*$/i,
	/^[0-9a-r]*$/i,
	/^[0-9a-s]*$/i,
	/^[0-9a-t]*$/i,
	/^[0-9a-u]*$/i,
	/^[0-9a-v]*$/i,
	/^[0-9a-w]*$/i,
	/^[0-9a-x]*$/i,
	/^[0-9a-y]*$/i,
	/^[0-9a-z]*$/i
];

/*
	Function: parse
	Parse a string into a <BigInteger>.
	*base* is optional but, if provided, must be from 2 to 36 inclusive. If
	*base* is not provided, it will be guessed based on the leading characters
	of *s* as follows:
	- "0": *base* = 10
	- else: *base* = 10
	If any characters fall outside the range defined by the radix, an exception
	will be thrown.
	Parameters:
		base - Optional radix (default is to guess based on *s*).

	Returns:
		a <BigInteger> instance.
*/
var parse_re = /^([+\-]?)((\d\d?)#)?([0-9a-z]+)$/i;

BigInteger.parse = function(s, base) {
	s = s.toString();
	var parts = parse_re.exec(s);

	if (!parts) {
		throw new Error("Invalid BigInteger format: " + s);
	}

	var sign = parts[1] || "+";
	var digits = parts[4] || "";

	if (typeof base === "undefined") {
		if (parts[2]) {
			base = parts[3];
		} else {
			base = 10;
		}
	}
	base = +base;

	if (base < 2 || base > 36) {
		throw new Error("Illegal radix " + base + ".");
	}

	// Check for digits outside the range
	if (!(BigInteger.radixRegex[base].test(digits))) {
		throw new Error("Bad digit for radix " + base);
	}

	// Strip leading zeros, and convert to array
	digits = digits.replace(/^0+/, "").split("");
	if (digits.length === 0) {
		return BigInteger.ZERO;
	}

	// Get the sign (we know it's not zero)
	sign = (sign === "-") ? -1 : 1;

	// Optimize base 10
	if (base === 10) {
		return new BigInteger(digits.map(Number).reverse(), sign);
	}

	// Do the conversion
	var d = BigInteger.ZERO;
	base = BigInteger(base);
	var small = BigInteger.small;
	for (var i = 0; i < digits.length; i++) {
		d = d.multiply(base).add(small[parseInt(digits[i], 36)]);
	}
	return new BigInteger(d._d, sign);
};


/*
	Function: negate
	Get the additive inverse of a <BigInteger>.
*/
BigInteger.prototype.negate = function() {
	return new BigInteger(this._d, -this._s);
};

/*
	Function: abs
	Get the absolute value of a <BigInteger>.
	Returns:
		A <BigInteger> with the same magnatude, but always positive (or zero).
*/
BigInteger.prototype.abs = function() {
	return (this._s < 0) ? this.negate() : this;
};

/*
	Function: add
	Add two <BigIntegers>.
	Parameters:
		n - The number to add to *this*. Will be converted to a <BigInteger>.
	Returns:
		The numbers added together.
*/
BigInteger.prototype.add = function(n) {
	if (this._s === 0) {
		return BigInteger(n);
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return this;
	}
	if (this._s !== n._s) {
		return this.subtract(n.negate());
	}

	var a = this._d;
	var b = n._d;
	var al = a.length;
	var bl = b.length;
	var sum = new Array(Math.max(al, bl) + 1);
	var size = Math.min(al, bl);
	var carry = 0;

	for (var i = 0; i < size; i++) {
		var digit = a[i] + b[i] + carry;
		sum[i] = digit % 10;
		carry = (digit / 10) | 0;
	}
	if (bl > al) {
		a = b;
		al = bl;
	}
	for (var i = size; carry && i < al; i++) {
		var digit = a[i] + carry;
		sum[i] = digit % 10;
		carry = (digit / 10) | 0;
	}
	if (carry) {
		sum[i] = carry;
	}

	for ( ; i < al; i++) {
		sum[i] = a[i];
	}

	return new BigInteger(sum, this._s);
};

/*
	Function: subtract
	Subtract two <BigIntegers>.
	Parameters:
		n - The number to subtract from *this*. Will be converted to a <BigInteger>.
	Returns:
		The *n* subtracted from *this*.
*/
BigInteger.prototype.subtract = function(n) {
	if (this._s === 0) {
		return BigInteger(n).negate();
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return this;
	}
	if (this._s !== n._s) {
		return this.add(n.negate());
	}

	var m = this;
	// negative - negative => -|a| - -|b| => -|a| + |b| => |b| - |a|
	if (this._s < 0) {
		var t = m;
		m = new BigInteger(n._d, 1);
		n = new BigInteger(t._d, 1);
	}

	// Both are positive => a - b
	var sign = m.compareAbs(n);
	if (sign === 0) {
		return BigInteger.ZERO;
	}
	else if (sign < 0) {
		// swap m and n
		var t = n;
		n = m;
		m = t;
	}

	// a > b
	var a = m._d;
	var b = n._d;
	var al = a.length;
	var bl = b.length;
	var diff = new Array(al); // al >= bl since a > b
	var borrow = 0;

	for (var i = 0; i < bl; i++) {
		var digit = a[i] - borrow - b[i];
		if (digit < 0) {
			digit += 10;
			borrow = 1;
		}
		else {
			borrow = 0;
		}
		diff[i] = digit;
	}
	for (var i = bl; i < al; i++) {
		var digit = a[i] - borrow;
		if (digit < 0) {
			digit += 10;
		}
		else {
			diff[i++] = digit;
			break;
		}
		diff[i] = digit;
	}
	for ( ; i < al; i++) {
		diff[i] = a[i];
	}

	return new BigInteger(diff, sign);
};

/*
	Function: compareAbs
	Compare the absolute value of two <BigIntegers>.
	Calling <compareAbs> is faster than calling <abs> twice, then <compare>.
	Parameters:
		n - The number to compare to *this*. Will be converted to a <BigInteger>.
	Returns:
		-1, 0, or +1 if *|this|* is less than, equal to, or greater than *|n|*.
*/
BigInteger.prototype.compareAbs = function(n) {
	if (this === n) {
		return 0;
	}

	n = BigInteger(n);
	if (this._s === 0) {
		return (n._s !== 0) ? -1 : 0;
	}
	if (n._s === 0) {
		return 1;
	}

	var l = this._d.length;
	var nl = n._d.length;
	if (l < nl) {
		return -1;
	}
	else if (l > nl) {
		return 1;
	}

	var a = this._d;
	var b = n._d;
	for (var i = l-1; i >= 0; i--) {
		if (a[i] !== b[i]) {
			return a[i] < b[i] ? -1 : 1;
		}
	}

	return 0;
};

/*
	Function: compare
	Compare two <BigIntegers>.
	Parameters:
		n - The number to compare to *this*. Will be converted to a <BigInteger>.
	Returns:
		-1, 0, or +1 if *this* is less than, equal to, or greater than *n*.
*/
BigInteger.prototype.compare = function(n) {
	if (this === n) {
		return 0;
	}

	n = BigInteger(n);

	if (this._s === 0) {
		return -n._s;
	}

	if (this._s === n._s) { // both positive or both negative
		var cmp = this.compareAbs(n);
		return cmp * this._s;
	}
	else {
		return this._s;
	}
};

/*
	Function: isUnit
	Return true iff *this* is either 1 or -1.
	Returns:
		true if *this* compares equal to <BigInteger.ONE> or <BigInteger.M_ONE>.
*/
BigInteger.prototype.isUnit = function() {
	return this === BigInteger.ONE ||
		this === BigInteger.M_ONE ||
		(this._d.length === 1 && this._d[0] === 1);
};

BigInteger.prototype.multiply = function(n) {
	// TODO: Consider adding Karatsuba multiplication for large numbers
	if (this._s === 0) {
		return BigInteger.ZERO;
	}

	n = BigInteger(n);
	if (n._s === 0) {
		return BigInteger.ZERO;
	}
	if (this.isUnit()) {
		return (this._s < 0 ? n.negate() : n);
	}
	if (n.isUnit()) {
		return (this._s < 0 ? this.negate() : this);
	}
	if (this === n) {
		return this.square();
	}

	var r = (this._d.length >= n._d.length);
	var a = (r ? this : n)._d; // a will be longer than b
	var b = (r ? n : this)._d;
	var al = a.length;
	var bl = b.length;

	var pl = al + bl;
	var partial = new Array(pl);
	for (var i = 0; i < pl; i++) {
		partial[i] = 0;
	}

	for (var i = 0; i < bl; i++) {
		var carry = 0;
		var bi = b[i];
		var jlimit = al + i;
		for (var j = i; j < jlimit; j++) {
			var digit = partial[j] + bi * a[j - i] + carry;
			carry = (digit / 10) | 0;
			partial[j] = (digit % 10) | 0;
		}
		if (carry) {
			var digit = partial[j] + carry;
			carry = (digit / 10) | 0;
			partial[j] = digit % 10;
		}
	}
	return new BigInteger(partial, this._s * n._s);
};

// Multiply a BigInteger by a single-digit native number
// Assumes that this and n are >= 0
// This is not really intended to be used outside the library itself
BigInteger.prototype.multiplySingleDigit = function(n, cache) {
	if (n === 0 || this._s === 0) {
		return BigInteger.ZERO;
	}
	if (n === 1) {
		return this;
	}

	if (cache[n]) {
		return cache[n];
	}

	if (this._d.length === 1) {
		var digit = this._d[0] * n;
		if (digit > 9) {
			return new BigInteger([(digit % 10)|0, (digit / 10)|0], 1);
		}
		cache[n] = BigInteger.small[digit];
		return cache[n];
	}

	if (n === 2) {
		cache[n] = this.add(this);
		return cache[n];
	}
	if (this.isUnit()) {
		cache[n] = BigInteger.small[n];
		return cache[n];
	}

	var a = this._d;
	var al = a.length;

	var pl = al + 1;
	var partial = new Array(pl);
	for (var i = 0; i < pl; i++) {
		partial[i] = 0;
	}

	var carry = 0;
	for (var j = 0; j < al; j++) {
		var digit = n * a[j] + carry;
		carry = (digit / 10) | 0;
		partial[j] = (digit % 10) | 0;
	}
	if (carry) {
		var digit = carry;
		carry = (digit / 10) | 0;
		partial[j] = digit % 10;
	}

	cache[n] = new BigInteger(partial, 1);
	return cache[n];
};

BigInteger.prototype.square = function() {
	if (this._s === 0) {
		return BigInteger.ZERO;
	}
	if (this.isUnit()) {
		return BigInteger.ONE;
	}

	var digits = this._d;
	var length = digits.length;
	var imult1 = new Array(length + length + 1);
	var product, carry, k;

	// Calculate diagonal
	for (var i = 0; i < length; i++) {
		k = i * 2;
		product = digits[i] * digits[i];
		carry = (product / 10) | 0;
		imult1[k] = product % 10;
		imult1[k + 1] = carry;
	}

	// Calculate repeating part
	for (var i = 0; i < length; i++) {
		carry = 0;
		k = i * 2 + 1;
		for (var j = i + 1; j < length; j++, k++) {
			product = digits[j] * digits[i] * 2 + imult1[k] + carry;
			carry = (product / 10) | 0;
			imult1[k] = product % 10;
		}
		k = length + i;
		var digit = carry + imult1[k];
		carry = (digit / 10) | 0;
		imult1[k] = digit % 10;
		imult1[k + 1] += carry;
	}

	return new BigInteger(imult1, 1);
};

BigInteger.prototype.divide = function(n) {
	return this.divRem(n)[0];
};

BigInteger.prototype.remainder = function(n) {
	return this.divRem(n)[1];
};

/*
	Function: divRem
	Calculate the integer quotient and remainder of two <BigIntegers>.

	<divRem> throws an exception if *n* is zero.

	Parameters:

		n - The number to divide *this* by. Will be converted to a <BigInteger>.
	Returns:
		A two-element array containing the quotient and the remainder.
		> a.divRem(b)
		is exactly equivalent to
		> [a.divide(b), a.remainder(b)]
		except it is faster, because they are calculated at the same time.
*/
BigInteger.prototype.divRem = function(n) {
	n = BigInteger(n);
	if (n._s === 0) {
		throw new Error("Divide by zero");
	}
	if (this._s === 0) {
		return [BigInteger.ZERO, BigInteger.ZERO];
	}
	if (n._d.length === 1) {
		return this.divRemSmall(n._s * n._d[0]);
	}

	// Test for easy cases -- |n1| <= |n2|
	switch (this.compareAbs(n)) {
	case 0: // n1 == n2
		return [this._s === n._s ? BigInteger.ONE : BigInteger.M_ONE, BigInteger.ZERO];
	case -1: // |n1| < |n2|
		return [BigInteger.ZERO, this];
	}

	var sign = this._s * n._s;
	var a = n.abs();
	var cache = new Array(10);
	var b_digits = this._d.slice();
	var digits = n._d.length;
	var max = b_digits.length;
	var quot = [];

	var part = new BigInteger([], 1);
	part._s = 1;

	while (b_digits.length) {
		part._d.unshift(b_digits.pop());
		part = new BigInteger(part._d, 1);

		if (part.compareAbs(n) < 0) {
			quot.push(0);
			continue;
		}
		if (part._s === 0) {
			var guess = 0;
		}
		else {
			var guess = 9;
		}
		do {
			var check = a.multiplySingleDigit(guess, cache);
			if (check.compareAbs(part) <= 0) {
				break;
			}
			guess--;
		} while (guess);

		quot.push(guess);
		if (!guess) {
			continue;
		}
		var diff = part.subtract(check);
		part._d = diff._d.slice();
	}

	return [new BigInteger(quot.reverse(), sign), new BigInteger(part._d, this._s)];
};

// Throws an exception if n is outside of [-9, -1] or [1, 9].
// It's not necessary to call this, since the other division functions will call
// it if they are able to.
BigInteger.prototype.divRemSmall = function(n) {
	n = +n;
	if (n === 0) {
		throw new Error("Divide by zero");
	}

	var n_s = n < 0 ? -1 : 1;
	var sign = this._s * n_s;
	n = Math.abs(n);

	if (n < 1 || n > 9) {
		throw new Error("Argument out of range");
	}

	if (this._s === 0) {
		return [BigInteger.ZERO, BigInteger.ZERO];
	}

	if (n === 1 || n === -1) {
		return [(sign === 1) ? this.abs() : new BigInteger(this._d, sign), BigInteger.ZERO];
	}

	// 2 <= n <= 9

	// divide a single digit by a single digit
	if (this._d.length === 1) {
		var q = BigInteger.small[(this._d[0] / n) | 0];
		var r = BigInteger.small[(this._d[0] % n) | 0];
		if (sign < 0) {
			q = q.negate();
		}
		if (this._s < 0) {
			r = r.negate();
		}
		return [q, r];
	}

	var digits = this._d.slice();
	var quot = new Array(digits.length);
	var part = 0;
	var diff = 0;
	var i = 0;

	while (digits.length) {
		part = part * 10 + digits[digits.length - 1];
		if (part < n) {
			quot[i++] = 0;
			digits.pop();
			diff = 10 * diff + part;
			continue;
		}
		if (part === 0) {
			var guess = 0;
		}
		else {
			var guess = (part / n) | 0;
		}

		var check = n * guess;
		diff = part - check;
		quot[i++] = guess;
		if (!guess) {
			digits.pop();
			continue;
		}

		digits.pop();
		part = diff;
	}

	var r = BigInteger.small[diff];
	if (this._s < 0) {
		r = r.negate();
	}
	return [new BigInteger(quot.reverse(), sign), r];
};

BigInteger.prototype.isEven = function() {
	var digits = this._d;
	return this._s === 0 || digits.length === 0 || (digits[0] % 2) === 0;
};

BigInteger.prototype.isOdd = function() {
	return !this.isEven();
};

BigInteger.prototype.sign = function() {
	return this._s;
};

BigInteger.prototype.isPositive = function() {
	return this._s > 0;
};

BigInteger.prototype.isNegative = function() {
	return this._s < 0;
};
BigInteger.prototype.isZero = function() {
	return this._s === 0;
};

/*
	Function: valueOf
	Convert a <BigInteger> to a native JavaScript integer.
	This is called automatically by JavaScipt to convert a <BigInteger> to a
	native value.
	Returns:
		> parseInt(this.toString(), 10)
*/
BigInteger.prototype.valueOf = function() {
	return parseInt(this.toString(), 10);
};

(function() {
	function makeUnary(fn) {
		return function(a) {
			return fn.call(BigInteger(a));
		};
	}
	function makeBinary(fn) {
		return function(a, b) {
			return fn.call(BigInteger(a), BigInteger(b));
		};
	}
	(function() {
		var unary = "toJSValue,isEven,isOdd,isZero,isNegative,abs,isUnit,square,negate,isPositive,toString".split(",");
		var binary = "compare,remainder,divRem,subtract,add,divide,multiply,compareAbs".split(",");

		for (var i = 0; i < unary.length; i++) {
			var fn = unary[i];
			BigInteger[fn] = makeUnary(BigInteger.prototype[fn]);
		}

		for (var i = 0; i < binary.length; i++) {
			var fn = binary[i];
			BigInteger[fn] = makeBinary(BigInteger.prototype[fn]);
		}
	})();
})();

// TODO: bsl, bsr, bxor, band, bor, band.
// unfortunetly this operations (beyond bnot)
// are suboptimal in bases other than power of 2
// my proposition: use 10 or 100 or 10000 base
// if any binary operation will be involved
// convert value or both to the binary representation 0xffffffffff base
// and cache value in original reference and calculate
// operation in binary representation only
// if in any subsequent operations we will have such values as one or both operands
// use only binary representation as result
// convert to decimal only before printing or conversion to list.

