FROM node:0.12.14
MAINTAINER Ivan Rodriguez Murillo <wantez@gmail.com>

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install build dependencies
RUN apt-get update
RUN apt-get install -y libcairo2-dev libjpeg-dev libpango1.0-dev libgif-dev build-essential g++

# Install app dependencies
COPY package.json /usr/src/app/
COPY server.js /usr/src/app/
RUN npm install --production
RUN npm install -g forever

# Bundle app source
COPY ./dist/server /usr/src/app/server
COPY ./dist/public /usr/src/app/public


ENV NODE_ENV production
ENV PORT 8080
ENV REDIS_URL "redis://redis:$REDIS_PORT_6379_TCP_PORT"
ENV MONGO_URL "mongodb://mongo/grid"

EXPOSE 8080
CMD [ "forever", "-f", "server.js" ]
