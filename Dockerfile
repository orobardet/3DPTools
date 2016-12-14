FROM node:7
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apt-get update \
    && apt-get install --no-install-recommends -y ruby imagemagick \
    && gem install sass \
    && apt-get clean \
    && rm -rf /tmp/* /var/lib/apt/lists/*

ENV PORT=3000
ENV NODE_ENV=production

COPY src /3dptools
COPY docker/docker_start.sh /docker_start.sh
RUN chmod +x /docker_start.sh

WORKDIR /3dptools

RUN npm install && node_modules/.bin/bower --allow-root install
RUN scss -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]

