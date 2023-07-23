# Discord Frontend Cloner
A piece of software which automatically creates a locally-hostable version of Discord's frontend.

> **Warning**
Backend not included!

# How to use
1. Clone the repo
2. Go into it, open up your terminal and run:
- `npm i`
- `npm run start`
3. Now wait! The main part of this project is an asset downloader, which searches, in this order, HTML, then CSS, then JS files using some not-as-efficient-as-they-could-be regular expressions. This long wait will only occur for the first run (and, chances are, any subsequent updates may take an extra few seconds to start due to refreshing JS files and any additional assets which got added.)
4. It'll say in the console when it's done, and say what port its listening on. In order to change this, copy `.env.example` to `.env` and change `PORT` to your desired port.

## I want to preserve the current build I have downloaded.
By default, this project will overwrite the current frontend and download a fresh one on each run. If you don't want this behaviour occuring, run `node .` in the `discord` folder instead of `npm run start` in the main folder. It accepts 1 argument, for the port (i.e. `node . 80` for port 80).

# Why?
Hosting a local instance of a given app has many uses; i.e. an intranet, bypassing censorship by running offline, confidentiality, etc.
