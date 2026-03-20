import pdfParse from 'pdf-parse';

export async function extractText(buffer: Buffer, filename: string): Promise<string> {
  const ext = filename.toLowerCase().split('.').pop();

  if (ext === 'txt') {
    return buffer.toString('utf-8').trim();
  }

  if (ext === 'pdf') {
    const data = await pdfParse(buffer);
    return data.text.trim();
  }

  throw new Error(`Unsupported file type: .${ext}. Use PDF or TXT.`);
}
