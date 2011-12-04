#!/bin/sh

# Copyright 2009-2011, Witold Baryluk <baryluk@smp.if.uj.edu.pl>
# erljs project

# some kind of bug in rhino
exec rhino -opt -1 erljs_rhino_autorun.js
#echo 'load("erljs_rhino_autorun.js")' | rhino


# this is a rhino limitation
# for some reason (security?) rhino doesn't
# allow input files bigger than some constant.
# https://bugzilla.mozilla.org/show_bug.cgi?format=multiple&id=563163
# Disabling optimialization (-opt -1), make it work.

