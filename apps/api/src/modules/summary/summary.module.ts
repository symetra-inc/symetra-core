import { Module } from '@nestjs/common';
import { SummaryService } from './summary.service';
import { OpenAIModule } from '../openai/openai.module';

@Module({
  imports: [OpenAIModule],
  providers: [SummaryService],
  exports: [SummaryService],
})
export class SummaryModule {}
