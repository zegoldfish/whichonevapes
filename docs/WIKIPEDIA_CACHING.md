# Wikipedia Aggressive Caching Setup

This setup implements a multi-tier caching strategy for Wikipedia data:

## Architecture

1. **L1 Cache (In-Memory)**: Fast access for frequently accessed data (6 hours TTL)
2. **L2 Cache (DynamoDB + S3)**: Persistent cache across server restarts (6 months TTL)
   - **DynamoDB**: Stores metadata (title, bio, URLs)
   - **S3**: Stores actual Wikipedia images
   - **CloudFront**: CDN for fast global image delivery

## Infrastructure Components

### S3 Bucket
- Bucket: `whichonevapes-wikipedia-cache`
- Stores Wikipedia images permanently
- Lifecycle policies transition old images to cheaper storage classes
- Private bucket with CloudFront access only

### CloudFront Distribution
- Serves S3 images globally with low latency
- HTTPS only
- 1 year cache TTL (images rarely change)
- Automatic compression

### DynamoDB Table
- Table: `WikipediaCache`
- Hash Key: `pageId` (Wikipedia page ID)
- TTL enabled: Auto-deletes entries after 6 months
- Pay-per-request billing (cost-effective)

## Deployment Steps

### 1. Apply Terraform Configuration

\`\`\`bash
cd terraform
terraform init
terraform plan
terraform apply
\`\`\`

### 2. Update Environment Variables

After terraform apply, get the outputs:

\`\`\`bash
terraform output
\`\`\`

Add to your `.env.local`:

\`\`\`bash
WIKIPEDIA_CACHE_TABLE=WikipediaCache
WIKIPEDIA_CACHE_BUCKET=whichonevapes-wikipedia-cache
CLOUDFRONT_URL=https://[your-cloudfront-domain].cloudfront.net
\`\`\`

### 3. Update Production Environment

Add the same environment variables to your EC2 instance or hosting environment.

## How It Works

### Single Page Fetch
\`\`\`typescript
import { fetchWikipediaData } from '@/lib/wikipedia';

const data = await fetchWikipediaData('12345');
// 1. Checks in-memory cache (instant)
// 2. Checks DynamoDB cache (fast)
// 3. Fetches from Wikipedia API (slow, only first time)
// 4. Caches image to S3
// 5. Saves metadata to DynamoDB
\`\`\`

### Batch Fetch
\`\`\`typescript
import { fetchWikipediaDataBatch } from '@/lib/wikipedia';

const results = await fetchWikipediaDataBatch(['12345', '67890']);
// Uses Wikipedia's batch API (50 pages per request)
// Checks caches in parallel
\`\`\`

## Benefits

1. **Drastically Reduced API Calls**: Only first request hits Wikipedia
2. **Faster Load Times**: Cached images served via CloudFront CDN
3. **Cost Savings**: 
   - DynamoDB: ~$0.25 per million reads
   - S3: ~$0.023 per GB
   - CloudFront: ~$0.085 per GB
4. **Resilience**: If Wikipedia is down, cached data still works
5. **No Rate Limiting**: After initial cache population
6. **Global Performance**: CloudFront edge locations worldwide

## Cache Invalidation

Wikipedia data rarely changes. If you need to refresh:

\`\`\`bash
# Delete from DynamoDB to force refresh
aws dynamodb delete-item \\
  --table-name WikipediaCache \\
  --key '{"pageId": {"S": "12345"}}'

# Optional: Delete S3 image (will be re-cached)
aws s3 rm s3://whichonevapes-wikipedia-cache/wikipedia/12345/[hash].jpg
\`\`\`

## Monitoring

Check cache hit rates:
\`\`\`bash
# View DynamoDB metrics
aws cloudwatch get-metric-statistics \\
  --namespace AWS/DynamoDB \\
  --metric-name ConsumedReadCapacityUnits \\
  --dimensions Name=TableName,Value=WikipediaCache \\
  --start-time 2025-12-24T00:00:00Z \\
  --end-time 2025-12-24T23:59:59Z \\
  --period 3600 \\
  --statistics Sum

# View S3 storage
aws s3 ls s3://whichonevapes-wikipedia-cache/wikipedia/ --recursive --summarize
\`\`\`

## Cost Estimates

Assuming 1,000 celebrities, each checked 10 times/day:

### Without Cache
- Wikipedia API calls: 10,000/day
- Risk of rate limiting: HIGH

### With Cache (after warm-up)
- **First Day**: 1,000 API calls + storage costs
- **Subsequent Days**: 0 API calls!
- **DynamoDB**: ~$0.01/day
- **S3**: ~$0.50/month (assuming 2GB total)
- **CloudFront**: ~$0.10/GB transferred

**Total estimated cost**: ~$1-2/month for unlimited cached access!
