# Discord Frontend Cloner

A piece of software which automatically creates a locally-hostable version of Discord's frontend.

> **Warning**<br>
> Backend not included!

# How to use

1. Clone the repo
2. Go into it, open up your terminal and run:

-   `npm i`
-   `npm run start`

3. Now wait! The main part of this project is an asset downloader, which searches, in this order, HTML, then CSS, then JS files using some not-as-efficient-as-they-could-be regular expressions. This long wait will only occur for the first run (and, chances are, any subsequent updates may take an extra few seconds to start due to refreshing JS files and any additional assets which got added.)
4. It'll say in the console when it's done, and say what port its listening on. In order to change this, copy `.env.example` to `.env` and change `PORT` to your desired port.

## I want to preserve the current build I have downloaded.

By default, this project will overwrite the current frontend and download a fresh one on each run. If you don't want this behaviour occuring, run `node .` in the `discord` folder instead of `npm run start` in the main folder. It accepts 1 argument, for the port (i.e. `node . 80` for port 80).

# Configration

This project comes with a `config.example.json`, which contains a lot of properties which you can use. Everything is contained in `config.schema.json`.

**GLOBAL_ENV**<br>
This contains the `window.GLOBAL_ENV` variable used in Discord's `index.html`. To see all available GLOBAL_ENV properties, go onto Discord, open up Devtools and type `window.GLOBAL_ENV`.

**patterns**<br>
This frontend cloner contains a somewhat intricate pattern find/replace system. It is calculated at runtime (only once, don't worry) so that you can modify it at any time. For example, the following will find all instances of "Discord" and replace it with "Not Discord, Dont Sue" (it's split into three because it's a little buggy with certain files):

```json
{
	"patterns": [
		{
			"find": " Discord",
			"replace": " Not Discord, Dont Sue",
			"type": "loose"
		},
		{
			"find": "Discord ",
			"replace": "Not Discord, Dont Sue ",
			"type": "loose"
		},
		{
			"find": "Discord",
			"replace": "Not Discord, Dont Sue",
			"type": "exact"
		}
	]
}
```

Typically, you'd use `"type": "loose"` for matching inside of a string, and `"type": "exact"` for matching a string containing _just_ the find pattern. The above causes a lot of changes across the platform, but some notable ones include:

# Why?

Hosting a local instance of a given app has many uses; i.e. an intranet, bypassing censorship by running offline, confidentiality, etc.
