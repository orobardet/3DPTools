FROM node:5.9
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

ENV PORT=3000

COPY src /3dptools

EXPOSE $PORT

WORKDIR /3dptools

CMD ["npm", "start"]

