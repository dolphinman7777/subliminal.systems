import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const s3 = new AWS.S3();

export async function GET() {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: 'backing-tracks/'
    };

    const data = await s3.listObjectsV2(params).promise();
    
    const tracks = data.Contents?.map(item => ({
      name: item.Key?.split('/').pop() || '',
      url: s3.getSignedUrl('getObject', { 
        Bucket: params.Bucket, 
        Key: item.Key!, 
        Expires: 3600 // URL expires in 1 hour
      })
    })) || [];

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching backing tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch backing tracks' }, { status: 500 });
  }
}
