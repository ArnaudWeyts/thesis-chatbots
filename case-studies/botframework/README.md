# Project SIBA Bot API

This is the API backend for SIBA. Built using the microsoft Bot Builder SDK.

## Recommendations

- [Visual Studio Code](https://code.visualstudio.com)
- [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Running the bot

### Install dependencies
```sh
$ npm install

or

$ yarn install
```

### Set up your API keys

#### Rename the `.env.example` to `.env`
```sh
$ mv .env.example .env
```

#### Proceed to fill in your own API keys

### To run the bot in developer mode:
```sh
$ npm run dev

or

$ yarn dev
```

### To run unit tests:
```sh
$ npm run test

or

$ yarn test
```

### A production bundle of the bot can be compiled into the `build` directory using:
```sh
$ npm run build

or

$ yarn build
```