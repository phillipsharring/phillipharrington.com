#!/bin/bash

[[ ! -z "$1" ]] && BUILDFILE=$1 || BUILDFILE=./buildspec.yml

/bin/bash ./bin/codebuild_build.sh \
  -i aws/codebuild/al2:2.0 \
  -a /tmp/cb \
  -s `pwd` \
  -c \
  -b $BUILDFILE \
  -m
