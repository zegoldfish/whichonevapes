import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const REGION = process.env.AWS_REGION || "us-east-1";
export const CELEBRITIES_TABLE_NAME = process.env.CELEBRITIES_TABLE_NAME || "Celebrities";

const client = new DynamoDBClient({ region: REGION });

export const ddb = DynamoDBDocumentClient.from(client);
