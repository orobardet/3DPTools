# 3DPTools
Web-based 3DPrinting tools

# Requirements

## Run

- NodeJS & NPM (5.9.x)
- ImageMagick

## Dev/build

- Bower (`sudo npm install -g bower`)
- build-essential
- SASS (`sudo apt-get install ruby-sass`)
- Docker

# Build

```shell
cd src
npm install
bower install
scss -f public/stylesheets/style.scss > public/stylesheets/style.css
cd ..
docker build -t orobardet/3dptools:$(cat VERSION) .
```

