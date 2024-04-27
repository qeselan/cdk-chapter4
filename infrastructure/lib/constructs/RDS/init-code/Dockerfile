FROM amazon/aws-lambda-nodejs:20
WORKDIR ${LAMBDA_TASK_ROOT}

ADD . .
RUN npm install && npm run build

CMD [ "index.handler" ]