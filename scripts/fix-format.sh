#!/bin/bash
# Fix two prettier issues with inline element closing tags:
#
# 1. Split closing tags: </lnk\n  > → </lnk>
#    Prettier puts the closing > on the next line for inline elements,
#    which graspr-build can't parse.
#
# 2. Punctuation after closing tags: </lnk>\n  . → </lnk>.
#    Prettier wraps after the closing tag, pushing punctuation to the
#    next line, which renders as an unwanted space.
find content -name '*.html' -exec perl -0777 -pi -e '
    s/<\/(lnk|cde|strong|em|abr)\s*\n\s*>/<\/$1>/g;
    s/<\/(lnk|cde|strong|em|abr)>\s*\n\s*([.,;:!?)])/<\/$1>$2/g;
' {} +
