#!/bin/bash
# Fix prettier splitting inline closing tags from following punctuation.
# Prettier wraps lines after </lnk>, </cde>, </strong>, </em>, </abr> and
# pushes the punctuation to the next line, which renders as an unwanted space.
find content -name '*.html' -exec perl -0777 -pi -e \
    's/<\/(lnk|cde|strong|em|abr)>\s*\n\s*([.,;:!?)])/<\/$1>$2/g' {} +
