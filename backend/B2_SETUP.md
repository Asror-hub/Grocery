# Backblaze B2 Storage Setup

To enable image uploads for boxes and products, you need to configure Backblaze B2 storage.

## Required Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Database Configuration
DB_NAME=grocery_db
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Server Configuration
PORT=5000

# Backblaze B2 Storage Configuration
B2_ACCOUNT_ID=your-b2-account-id
B2_APPLICATION_KEY=your-b2-application-key
B2_BUCKET_NAME=your-bucket-name
B2_PUBLIC_URL=https://f005.backblazeb2.com/file
B2_DOWNLOAD_URL=https://f005.backblazeb2.com/file
```

## How to Get B2 Credentials

1. Go to [Backblaze B2](https://www.backblaze.com/b2/cloud-storage.html)
2. Create an account and sign in
3. Go to "App Keys" in your account
4. Create a new application key
5. Note down your Account ID and Application Key
6. Create a bucket and note the bucket name
7. Get the public URL from your bucket settings

## Current Status

Without B2 configuration, the app will:
- ✅ Still work for all other features
- ⚠️ Show placeholder images instead of uploaded images
- ⚠️ Log warnings about missing B2 configuration

## Testing Upload

Once B2 is configured, you can test image uploads by:
1. Creating a box in the admin panel
2. Uploading an image
3. Checking if the image appears in the mobile app 