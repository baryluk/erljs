#!/bin/sh

printf "%42s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" filename lines LOC size Cbytes Cgz6 Cgz9 Cgz9alt lonegst-line

for i in *.js */*.js
do

Z=`cat $i  | wc -c`

LOC=`egrep -v '^\s*($|/\*|//|\*|\};?\s*$)' $i  | wc -l`
LINES=`cat $i | wc -l`

C=`egrep -v '^\s*($|/\*|//|\*|\};?\s*$)' $i | wc -c`
D=`egrep -v '^\s*($|/\*|//|\*|\};?\s*$)' $i | gzip --stdout -6 | wc -c`
D9=`egrep -v '^\s*($|/\*|//|\*|\};?\s*$)' $i | gzip --stdout -9 | wc -c`
D9a=`egrep -v '^\s*($|/\*|//|\*|\};?\s*$)' $i | 7z a dummy -tgzip -mx=9 -si -so 2>/dev/null | wc -c`


# wc have strange method of counting line lenght when it have \t character.
# it assumes it is normally 8 spaces, but not if it isn't alligned to 8 chars.
# so it have varying number of "bytes", from 1 to 8. This can make difference of about 20 chars for lines of 150 chars.
#E=`cat $i | wc --max-line-length`
E2=`cat $i | tr '\t' ' ' | wc --max-line-length`
printf "%42s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n" $i $LINES $LOC $Z $C $D $D9 $D9a $E2
#cat $i | tr '\t' ' ' | egrep -v '(^\s*$|^\s*//|^\s*\*)' | egrep '^.{120,}'
done

