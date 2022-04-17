FROM node
ENV NODE_ENV=production
WORKDIR /app
ARG CACHEBUST=1
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY . .
CMD [ "npx", "ts-node", "server.ts", "run" ]