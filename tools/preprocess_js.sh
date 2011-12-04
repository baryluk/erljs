#!/bin/sh

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

# http://www.nongnu.org/espresso/js-cpp.html
#
# GNU cpp

exec cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C "$@"

# Other possibilities
#  Gema - http://gema.sourceforge.net/
#  m4
