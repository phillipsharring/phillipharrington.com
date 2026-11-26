// Lambda entry point: wires app.mjs to the real AWS clients and translates
// between function-URL events and app.mjs's plain request/response objects.
// The AWS SDK ships with the Lambda Node.js runtime, so there is nothing to
// bundle.
//
// Environment:
//   SITE_URL         https://phillipharrington.com
//   BUCKET           comments bucket name
//   DISTRIBUTION_ID  CloudFront distribution to invalidate on approve
//   FROM, TO         notification email (FROM must be SES-verified)
//   SECRET_PARAM     SSM SecureString holding {"hmacKey": "...", "originSecret": "..."}

import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { CloudFrontClient, CreateInvalidationCommand } from '@aws-sdk/client-cloudfront';
import { SSMClient, GetParameterCommand } from '@aws-sdk/client-ssm';
import { createApp } from './app.mjs';

const env = process.env;
const s3 = new S3Client({});
const ses = new SESv2Client({});
const cloudfront = new CloudFrontClient({});
const ssm = new SSMClient({});

// Read the secrets once per container, not once per request.
let appPromise;
function app() {
    appPromise ??= ssm
        .send(new GetParameterCommand({ Name: env.SECRET_PARAM, WithDecryption: true }))
        .then(({ Parameter }) => {
            const secrets = JSON.parse(Parameter.Value);
            return createApp({
                config: {
                    siteUrl: env.SITE_URL,
                    hmacKey: secrets.hmacKey,
                    originSecret: secrets.originSecret,
                    from: env.FROM,
                    to: env.TO,
                },
                getObject,
                putObject,
                sendEmail,
                invalidate,
                fetchPage,
            });
        });
    return appPromise;
}

async function getObject(key) {
    try {
        const res = await s3.send(new GetObjectCommand({ Bucket: env.BUCKET, Key: key }));
        return await res.Body.transformToString();
    } catch (err) {
        if (err.name === 'NoSuchKey') return null;
        throw err;
    }
}

async function putObject(key, body) {
    await s3.send(
        new PutObjectCommand({
            Bucket: env.BUCKET,
            Key: key,
            Body: body,
            ContentType: 'application/json; charset=utf-8',
            // Browsers recheck within a minute; CloudFront holds it until the
            // next approval invalidates it.
            CacheControl: 'public, max-age=60, s-maxage=31536000',
        }),
    );
}

async function sendEmail({ from, to, subject, body }) {
    await ses.send(
        new SendEmailCommand({
            FromEmailAddress: from,
            Destination: { ToAddresses: [to] },
            Content: { Simple: { Subject: { Data: subject }, Body: { Text: { Data: body } } } },
        }),
    );
}

async function invalidate(path) {
    await cloudfront.send(
        new CreateInvalidationCommand({
            DistributionId: env.DISTRIBUTION_ID,
            InvalidationBatch: { CallerReference: `${Date.now()}-${path}`, Paths: { Quantity: 1, Items: [path] } },
        }),
    );
}

async function fetchPage(path) {
    const res = await fetch(`${env.SITE_URL}${path}`);
    return res.ok ? res.text() : null;
}

export async function handler(event) {
    const http = event.requestContext.http;
    const body = event.body ? (event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body) : '';
    const res = await (
        await app()
    )({
        method: http.method,
        path: event.rawPath,
        query: event.rawQueryString ?? '',
        headers: event.headers ?? {},
        body,
    });
    return { statusCode: res.status, headers: res.headers, body: res.body };
}
