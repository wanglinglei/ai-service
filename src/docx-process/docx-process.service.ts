import { Injectable } from '@nestjs/common';
import { parseDocxWithMammoth } from './utils/docxParser';

@Injectable()
export class DocxProcessService {
  async process(
    rawFile: Express.Multer.File,
    templateFile: Express.Multer.File,
  ): Promise<string> {
    const fields = await parseDocxWithMammoth(templateFile.path);

    return 'ok';
  }
}
