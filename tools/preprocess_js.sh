#!/bin/sh

# http://www.nongnu.org/espresso/js-cpp.html
#
# GNU cpp

exec cpp -P -undef -Wundef -std=c99 -nostdinc -Wtrigraphs -fdollars-in-identifiers -C "$@"

# Other possibilities
#  Gema - http://gema.sourceforge.net/
#  m4
