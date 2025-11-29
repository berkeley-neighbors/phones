FROM node:24

ENV ALLOWED_HOST="localhost"
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
RUN npm run build

CMD ["npm", "start"]