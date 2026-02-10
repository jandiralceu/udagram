import {
  DeleteCommand,
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
} from '@aws-sdk/lib-dynamodb'

export const putItem = async <T extends Record<string, unknown>>(
  doc: DynamoDBDocumentClient,
  tableName: string,
  item: T
) => {
  await doc.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  )
}

export const getItem = async <T extends Record<string, unknown>>(
  doc: DynamoDBDocumentClient,
  tableName: string,
  key: Record<string, unknown>
) => {
  const result = await doc.send(
    new GetCommand({
      TableName: tableName,
      Key: key,
    })
  )
  return result.Item as T | undefined
}

export const deleteItem = async (
  doc: DynamoDBDocumentClient,
  tableName: string,
  key: Record<string, unknown>
) => {
  await doc.send(
    new DeleteCommand({
      TableName: tableName,
      Key: key,
    })
  )
}
