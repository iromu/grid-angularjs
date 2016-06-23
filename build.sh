#!/usr/bin/env bash

eval $(docker-machine env default)
docker build -t iromu/grid-angularjs:latest .
