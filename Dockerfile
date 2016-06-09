FROM node:5.9
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

ENV PORT=3000

COPY src /3dptools
WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install

EXPOSE $PORT

CMD ["npm", "start"]

