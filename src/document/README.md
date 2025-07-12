# Document Module

This module manages patient documents in the dental clinic system. It provides endpoints for creating, listing, updating, and deleting documents associated with patients.

## Features
- Create documents for patients (prescriptions, reports, consents, etc.)
- List/filter documents by patient, type, search, and pagination
- Get a single document by ID
- Update document metadata
- Soft delete documents

## Data Structure

### Document Entity
- `id` (uuid)
- `patientId` (uuid)
- `type` (enum: prescription, report, consent, invoice, other)
- `title` (string)
- `description` (string, optional)
- `fileUrl` (string, optional)
- `createdAt`, `updatedAt`, `deletedAt`

## DTOs

### CreateDocumentDto
- `patientId` (uuid, required)
- `type` (enum, required)
- `title` (string, required)
- `description` (string, optional)
- `fileUrl` (string, optional)

### UpdateDocumentDto
- All fields optional (partial update)

### FilterDocumentDto
- `patientId` (uuid, optional)
- `type` (enum, optional)
- `search` (string, optional)
- `page` (number, optional, default 1)
- `limit` (number, optional, default 10)

## API Endpoints

### Create Document
```http
POST /documents
Content-Type: application/json

{
  "patientId": "uuid-patient",
  "type": "report",
  "title": "Dental X-Ray Report",
  "description": "Routine checkup x-ray",
  "fileUrl": "https://files.example.com/doc.pdf"
}
```

### List Documents
```http
GET /documents?patientId=uuid-patient&type=report&search=x-ray&page=1&limit=10
```

### Get Document by ID
```http
GET /documents/:id
```

### Update Document
```http
PATCH /documents/:id
Content-Type: application/json

{
  "title": "Updated Title",
  "description": "Updated description"
}
```

### Delete Document (Soft Delete)
```http
DELETE /documents/:id
```

## Usage Examples

### Creating a Document
```typescript
const doc = await documentService.create({
  patientId: 'uuid-patient',
  type: 'report',
  title: 'Dental X-Ray Report',
  description: 'Routine checkup x-ray',
  fileUrl: 'https://files.example.com/doc.pdf'
});
```

### Listing Documents
```typescript
const { documents, total } = await documentService.findAll({
  patientId: 'uuid-patient',
  type: 'report',
  search: 'x-ray',
  page: 1,
  limit: 10
});
```

### Updating a Document
```typescript
const updated = await documentService.update(docId, { title: 'Updated Title' });
```

### Deleting a Document
```typescript
await documentService.remove(docId);
```

## Notes
- No authentication/authorization is enforced yet (add later as needed)
- File uploads are not handled (use `fileUrl` for now)
- All deletes are soft deletes (data is preserved) 