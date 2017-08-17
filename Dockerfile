FROM node:8-alpine
MAINTAINER Olivier Robardet <olivier.robardet@gmail.com>

RUN apk --update add bash ruby imagemagick ca-certificates git && \
    apk --update add --virtual sass-dev build-base ruby-dev libffi-dev && \
	gem install -N sass && \
	apk del sass-dev && rm -rf /var/cache/apk/*

ENV PORT=3000
ENV NODE_ENV=production

ENV database__host=mongo

COPY src /3dptools
COPY CHANGELOG.md /3dptools/CHANGELOG.md
COPY docker/docker_start.sh /docker_start.sh
RUN chmod +x /docker_start.sh

WORKDIR /3dptools

RUN apk --update add --virtual 3dpt-dev build-base python && \
    npm install && node_modules/.bin/bower --allow-root install && \
    npm remove node-gyp && \
    npm cache clean --force && \
    node_modules/.bin/bower --allow-root cache clean && \
    rm -fr ~/.node-gyp ~/.npm ~/.cache && \
    apk del 3dpt-dev && rm -rf /var/cache/apk/*

RUN scss -C -f public/stylesheets/style.scss public/stylesheets/style.css

EXPOSE $PORT

CMD ["/docker_start.sh"]
