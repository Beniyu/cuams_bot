FROM node
ENV NODE_ENV=development
WORKDIR /app
COPY ["package.json", "package-lock.json*", "./"]
RUN npm install --production
COPY ../application .
CMD [ "node", "server.js" ]