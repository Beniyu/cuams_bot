#!/bin/bash
npm install
docker network create cuams_bot
docker-compose up -d
sleep(120)
node createDatabase.js