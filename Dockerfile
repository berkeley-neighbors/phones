FROM node:18

ENV PHONE_NUMBERS_FILE=/data/phone-numbers.json
ENV REPLY_MESSAGE="This is a one-time automated message to confirm you're messaging the right number. Someone in the group should reply later, but you can also keep sending messages."
ENV API_TOKEN="your_api_token_here"
ENV ALLOWED_HOST="localhost"
ENV TWILIO_ALLOWED_PHONE_NUMBER="your_twilio_allowed_phone_number_here"
ENV TWILIO_ACCOUNT_SID="your_twilio_account_sid_here"
ENV TWILIO_API_TOKEN="your_twilio_api_token_here"
ENV TWILIO_API_SECRET="your_twilio_api_secret_here"
ENV SYNOLOGY_SSO_URL="http://localhost/sso"
ENV SYNOLOGY_SSO_APP_ID="your_synology_sso_app_id_here"

EXPOSE 3000
EXPOSE 4000

WORKDIR /app

COPY . ./

RUN mkdir -p /data


RUN npm install

CMD ["npm", "start"]