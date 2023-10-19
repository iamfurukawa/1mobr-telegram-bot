# telegram-bot-sentiment

![workflow](https://github.com/leonardofurnielis/telegram-bot-sentiment/actions/workflows/build-test.yml/badge.svg)
[![codecov](https://codecov.io/gh/leonardofurnielis/telegram-bot-sentiment/branch/master/graph/badge.svg?token=deQmKPNEIY)](https://codecov.io/gh/leonardofurnielis/telegram-bot-sentiment)

## Table of Contents

- Developing locally
  - [Native runtime](#native-runtime)
  - [Containerized](#containerized)

## Native runtime 

To run this code in your computer execute the following commands into project root directory

```bash
./generate-rsa-key.sh

npm install
npm start
```

## Containerized

To run this code using Podman container execute the following commands into project root directory

```bash
./generate-rsa-key.sh

podman build -t node-cloudant .
podman run -p 8080:3000 -d node-cloudant
```