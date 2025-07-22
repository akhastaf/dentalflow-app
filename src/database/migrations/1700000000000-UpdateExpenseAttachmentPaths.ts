import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateExpenseAttachmentPaths1700000000000 implements MigrationInterface {
  name = 'UpdateExpenseAttachmentPaths1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Get all expenses with attachment paths that are full URLs
    const expenses = await queryRunner.query(`
      SELECT id, "attachmentPath" 
      FROM expenses 
      WHERE "attachmentPath" IS NOT NULL 
      AND "attachmentPath" LIKE 'http://%'
    `);

    for (const expense of expenses) {
      if (expense.attachmentPath) {
        // Extract file key from URL
        // URL format: http://minio:9000/dentistflow-files/expenses/tenantId/date/original/filename
        const urlParts = expense.attachmentPath.split('/');
        if (urlParts.length >= 6) {
          // Remove the first 5 parts: http://minio:9000/dentistflow-files
          const fileKey = urlParts.slice(5).join('/');
          
          // Update the expense with the file key
          await queryRunner.query(`
            UPDATE expenses 
            SET "attachmentPath" = $1 
            WHERE id = $2
          `, [fileKey, expense.id]);
        }
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // This migration is not reversible as we don't have the original MinIO endpoint info
    // In a real scenario, you might want to store the original URLs in a separate column
    console.log('Migration UpdateExpenseAttachmentPaths is not reversible');
  }
} 