import { NextResponse } from 'next/server';
import AWS from 'aws-sdk';

AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

// Import the CloudFront URL
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

export async function GET() {
  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME!,
      Prefix: 'backing-tracks/'
    };

    const s3 = new AWS.S3();
    const data = await s3.listObjectsV2(params).promise();
    
    const tracks = data.Contents?.map(item => ({
      name: item.Key?.split('/').pop() || '',
      // Replace S3 URL with CloudFront URL
      url: `${CLOUDFRONT_URL}/${item.Key}`,
      duration: 900 // Assuming each track is 15 minutes
    })) || [];

    return NextResponse.json({ tracks });
  } catch (error) {
    console.error('Error fetching backing tracks:', error);
    return NextResponse.json({ error: 'Failed to fetch backing tracks' }, { status: 500 });
  }
}
