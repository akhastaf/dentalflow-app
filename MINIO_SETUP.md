# MinIO Setup for DentalFlow

This document explains how to set up and use MinIO for local S3-compatible file storage.

## What is MinIO?

MinIO is a high-performance, S3-compatible object storage server. It's perfect for local development and testing of S3 functionality.

## Setup Instructions

### 1. Environment Variables

Make sure your `.env` file contains the following MinIO configuration:

```env
# MinIO Configuration
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin123
MINIO_BUCKET_NAME=dentistflow-files
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_REGION=us-east-1
```

### 2. Start the Services

```bash
# Start all services including MinIO
docker compose up -d

# Or start specific services
docker compose up -d db minio api
```

### 3. Access MinIO Console

- **MinIO Console**: http://localhost:9001
- **Login Credentials**: 
  - Username: `minioadmin`
  - Password: `minioadmin123`

### 4. Create Bucket (Optional)

The bucket will be created automatically when you first upload a file, but you can also create it manually through the MinIO console.

## API Endpoints

### File Upload
```http
POST /api/v1/files/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- file: <file>
- folder: <optional_folder_name>
```

### File Download
```http
GET /api/v1/files/download/:key
Authorization: Bearer <token>
```

### Get Signed URL
```http
GET /api/v1/files/url/:key
Authorization: Bearer <token>
```

### Delete File
```http
DELETE /api/v1/files/:key
Authorization: Bearer <token>
```

### Check File Exists
```http
GET /api/v1/files/exists/:key
Authorization: Bearer <token>
```

## Usage Examples

### Upload a File
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('folder', 'documents');

const response = await fetch('/api/v1/files/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
// {
//   key: "documents/file.pdf",
//   url: "http://localhost:9000/dentistflow-files/documents/file.pdf",
//   size: 12345,
//   contentType: "application/pdf"
// }
```

### Download a File
```javascript
const response = await fetch(`/api/v1/files/download/${fileKey}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
```

### Get Signed URL
```javascript
const response = await fetch(`/api/v1/files/url/${fileKey}`, {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { signedUrl } = await response.json();
// Use signedUrl for temporary access
```

## File Organization

Files are organized in the following structure:
- `documents/` - Patient documents, reports
- `images/` - Profile pictures, clinic images
- `attachments/` - Email attachments, notes
- `temp/` - Temporary files

## Security Features

1. **Authentication Required**: All file operations require a valid JWT token
2. **Signed URLs**: Temporary access URLs that expire
3. **File Validation**: File type and size validation
4. **Metadata Storage**: Original filename, size, upload date stored as metadata

## Production Considerations

When moving to production:

1. **Use AWS S3**: Replace MinIO with actual AWS S3
2. **Update Environment Variables**:
   ```env
   MINIO_ENDPOINT=s3.amazonaws.com
   MINIO_USE_SSL=true
   MINIO_ROOT_USER=<AWS_ACCESS_KEY_ID>
   MINIO_ROOT_PASSWORD=<AWS_SECRET_ACCESS_KEY>
   ```
3. **Add File Size Limits**: Implement maximum file size restrictions
4. **Add File Type Validation**: Restrict allowed file types
5. **Implement CDN**: Use CloudFront for better performance

## Troubleshooting

### MinIO Not Starting
```bash
# Check MinIO logs
docker compose logs minio

# Restart MinIO
docker compose restart minio
```

### Connection Issues
- Ensure MinIO is running: `docker compose ps`
- Check if port 9000 is available
- Verify environment variables are set correctly

### File Upload Issues
- Check file size limits
- Verify authentication token
- Ensure bucket exists

## Useful Commands

```bash
# View all containers
docker compose ps

# View MinIO logs
docker compose logs minio

# Restart MinIO
docker compose restart minio

# Stop all services
docker compose down

# Remove volumes (WARNING: deletes all data)
docker compose down -v
``` 