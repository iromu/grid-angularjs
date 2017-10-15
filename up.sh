#!/usr/bin/env bash

eval $(docker-machine env blackbox)
docker-compose up -d
