#!/usr/bin/env bash

eval $(docker-machine env default)
docker run -d -p 18380:8080 iromu/grid-angularjs
