import os
import boto3
import hashlib
import base64
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()
def generate_unique_hash(context):
    request_id = context.aws_request_id
    hash_object = hashlib.sha256(request_id.encode())
    short_hash = base64.urlsafe_b64encode(hash_object.digest()).decode()[:8]
    return short_hash

def check_dynamodb(short_hash):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('file-bin-table')
    response = table.get_item(
        Key={
            'hash': short_hash
        }
    )
    return 'Item' in response

def add_hash_to_dynamodb(short_hash):
    dynamodb = boto3.resource('dynamodb')
    table = dynamodb.Table('file-bin-table')
    table.put_item(
        Item={
            'hash': short_hash
        }
    )

def create_folder(bucket_name, folder_name):
    s3 = boto3.client('s3')
    s3.put_object(Bucket=bucket_name, Key=f"{folder_name}/")

def upload_files_to_folder(bucket_name, folder_name, files):
    s3 = boto3.client('s3')
    for file_data in files:
        file_name = file_data['name']
        file_body = file_data['data'] 
        s3.put_object(Bucket=bucket_name, Key=f"{folder_name}/{file_name}", Body=file_body)

def lambda_handler(event, context):
    bucket_name = os.environ['BUCKET_NAME']
    files = event['files']
    with xray_recorder.capture('Processing'):
        # TODO: write code...
        # Step 1: Generate a unique hash
        short_hash = generate_unique_hash(context)
    
        #Step 2: Check if the hash exists in DynamoDB
        while check_dynamodb(short_hash):
            # Step 3: Generate a new unique hash if the previous one exists
            short_hash = generate_unique_hash()
    
        # Step 4: Add the new hash to DynamoDB
        add_hash_to_dynamodb(short_hash)
    
        # Step 5: Create a new folder in S3 bucket
        folder_name = short_hash
        create_folder(bucket_name, folder_name)
    
        # Step 6: Upload files to the newly created folder in S3 bucket
        upload_files_to_folder(bucket_name, folder_name, files)

    return {
        'statusCode': 200,
        'body': f"Files uploaded successfully to folder '{folder_name}' in bucket '{bucket_name}'",
        'folder':folder_name
    }
