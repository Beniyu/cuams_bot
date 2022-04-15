call npm install --production
docker network create cuams_bot
docker-compose up -d
timeout 120
node createDatabase.js