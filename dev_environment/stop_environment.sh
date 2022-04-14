#!/bin/bash
docker-compose down
docker network rm cuams_bot
rm -r ./db
rm -r ./configdb