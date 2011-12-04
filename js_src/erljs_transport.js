/* Copyright 2008-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
 * erljs project
 */

if ('WebSocket' in window) {
  var ws = new WebSocket('ws://example.org:12345/demo', 'distributed-erljs');
  ws.onopen = function(e) {
    // the connection is now established
    // let's send a message
    this.send('Hello!');
  }
  ws.onclose = function(e) {
    alert('WebSocket closed :-(');
  }
  ws.onmessage = function(e) {
    // got a message from the server
    alert(e.data);
  }
  ws.onerror = function(e) {
    // something wrong
    alert(e);
    // reconnect, reset counters, eventually fallback to AJAX
  }
  //ws.close();
} else {
  // fallback to AJAX polling
  // (active - every few seconds, or passive - block on server side)
  alert("no web sockets");
}
