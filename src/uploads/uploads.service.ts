import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class UploadsService {
  constructor(private configService: ConfigService) {}

  async uploadFile(file: string, ext: string): Promise<string> {
    try {
      const response = await axios.post<string>(
        this.configService.get('UPLOADS_URL'),
        {
          file,
          ext,
        },
      );
      return response.data;
    } catch (err) {}
  }
}
