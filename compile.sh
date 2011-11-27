#!/bin/sh


# http://www.nongnu.org/espresso/js-cpp.html
#
# GNU cpp

/usr/bin/cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C $1

# Other possibilities
#  Gema - http://gema.sourceforge.net/
#  m4
