FROM node:5.9
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apt-get update \
    && apt-get install --no-install-recommends -y ruby \
    && gem install sass \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

ENV PORT=3000

COPY src /3dptools
WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install
RUN scss -f public/stylesheets/style.scss public/stylesheets/style.css


EXPOSE $PORT

CMD ["npm", "start"]

