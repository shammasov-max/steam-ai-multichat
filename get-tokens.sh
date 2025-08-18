#!/bin/bash
# Fast token extraction from claude-monitor
# Usage: ./get-tokens.sh

# Extract from previous claude-monitor run saved output
if [ -f "token-usage.log" ]; then
    tail -50 token-usage.log | grep -oE '[0-9,]+ / [0-9,]+|[0-9]+\.[0-9]+ tokens/min' | tail -2 | awk 'NR==1{gsub(/,/,"",$0); split($0,a,/ \/ /); t1=a[1]; t2=a[2]} NR==2{gsub(/ tokens\/min/,"",$0); print "T:"t1"/"t2" R:"$1"t/m"}'
else
    echo "T:? R:?"
fi