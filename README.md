# Berkeley Neighbors Phone Support

Web application to send and read SMS messages on behalf of Berkeley Neighbors.

**This project does not ship with any authentication system.**

Originally forked from [twilio-sms-web](https://github.com/rafacandev/twilio-sms-web). License included with this repository.

## Project structure

* `src/` - Front-end application
* `routers/` - Namespaced API routes
* `clients/` - Clients to interact with internal/external "services"
* `middleware.js` - Express-style middlewares
* `server.js` - Main server entry point

## Please note

This is alpha-level software customized to a specific org

* Features may be added or removed without notice
* Internals may shift rapidly
* Documentation will be likely out-of-date for the near future

# Twilio Account

You will need a Twilio account to read and send SMS messages.

## Twilio Free Account

If you don't have an account, Twilio offers a [free trial account][TwilioFreeTrial].
Once your account is created you will need to [verify your personal phone number][TwilioVerifyPersonalPhoneNumber].
Finally, you also need to [get a Twilio phone number with SMS capability][TwilioGetPhoneNumber].

# Screenshots

Sign-in

<img src='info/screenshot-sign-in.png' width='75%'>

Read messages:

<img src='info/screenshot-messages.png' width='75%'>

Compose messages:

<img src='info/screenshot-composer.png' width='75%'>

# Development

## NodeJs

We recommend using Node Version Manager that we can consistently align versions.

```
# On the first time
nvm install
# On subsequent times
nvm use
```

## Available Scripts

In the project directory, you can run:

## `npm start`

Runs the app in the development mode.
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.
You will also see any lint errors in the console.

## `npm run build`

It bundles React in production mode and optimizes the build for the best performance in the `build` folder.

A varient `npm run build:prod` is also available which is going to override the `.env` file with the values from a `.env-prod`.

## `npm run deploy`

Intended to be used after `npm run build:prod`.
It deploys the content from the `/build` folder to: https://rafacandev.github.io/twilio-sms-web/

## Environment Variables

This project uses [dotenv](https://github.com/motdotla/dotenv) to manage environment variables.
Developers can change these values according to their needs via environment variables or editing the `.env` file.

Sample `.env` file:

```
API_TOKEN
ALLOWED_HOST
SYNOLOGY_SSO_URL
SYNOLOGY_SSO_APP_ID
COOKIE_SECRET

# Include your authentication info
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxx
TWILIO_API_TOKEN=SKxxxxxxxxxxxxxxxxxxxx
TWILIO_API_SECRET=xxxxxxxxxxxxxxxxxxxx
```

`.env` files should be managed independently and they should not be pushed to the codebase repository.

[TwilioConsole]: https://www.twilio.com/console?
[TwilioFreeTrial]: https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account
[TwilioVerifyPersonalPhoneNumber]: https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#verify-your-personal-phone-number
[TwilioGetPhoneNumber]: https://www.twilio.com/docs/usage/tutorials/how-to-use-your-free-trial-account#get-your-first-twilio-phone-number
