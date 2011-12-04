/* Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
 * erljs project
 */

/* Linked Lists for use in scheduler
 *
 * This code is borowed from http://blog.jcoglan.com/2007/07/23/writing-a-linked-list-in-javascript/
 *
 * We will need to reimplement it, and remove all unacassary functions / fields / functionalities.
 */

function LinkedList() {
}

LinkedList.prototype = {
	length: 0,
	first: null,
	last: null
};

LinkedList.Circular = function() {};

LinkedList.Circular.prototype = new LinkedList();

LinkedList.Circular.prototype.append = function(node) {
	if (this.first === null) {
		node.prev = node;
		node.next = node;
		this.first = node;
		this.last = node;
	} else {
		node.prev = this.last;
		node.next = this.first;
		this.first.prev = node;
		this.last.next = node;
		this.last = node;
	}
	this.length++;
};

LinkedList.Circular.prototype.insertAfter = function(node, newNode) {
	newNode.prev = node;
	newNode.next = node.next;
	node.next.prev = newNode;
	node.next = newNode;
	if (newNode.prev == this.last) { this.last = newNode; }
	this.length++;
};

LinkedList.Circular.prototype.remove = function(node) {
	if (this.length > 1) {
		node.prev.next = node.next;
		node.next.prev = node.prev;
		if (node == this.first) { this.first = node.next; }
		if (node == this.last) { this.last = node.prev; }
	} else {
		this.first = null;
		this.last = null;
	}
	node.prev = null;
	node.next = null;
	this.length--;
};

LinkedList.Node = function(data) {
	this.prev = null;
	this.next = null;
	this.data = data;
};

/* usage
 myList = new LinkedList.Circular();
 myList.append(new LinkedList.Node(someObject));
 */
 
