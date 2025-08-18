import { convert } from 'magic-regexp/converter'

convert(/[abc]/)
// createRegExp(exactly('a').or('b').or('c'))

const rr = convert(/(foo)bar\d+/, {argsOnly:false})

rr.match('foo123bar')

import RR from 'typed-regexp'
const rr2 = RR(/(foo)bar\d+/)
rr2.match('foo123bar')





