import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { UpdateWebhookDto } from './dto/update-webhook.dto';
import { ListWebhooksQueryDto } from './dto/list-webhooks-query.dto';
import { parseWebhookBody } from './utils/parse-webhook-body';

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  /**
   * Receive webhook from external resource.
   * Body can be JSON object or string (will be parsed).
   * Stores full payload in Webhook model.
   */
  @Post()
  async receive(@Body() body: unknown) {
    const alertData = parseWebhookBody(body);
    const webhook = await this.webhooksService.create(alertData);
    return { id: webhook.id, received: true };
  }

  @Get()
  findAll(@Query() query: ListWebhooksQueryDto) {
    return this.webhooksService.findAll({
      symbol: query.symbol,
      strategy: query.strategy,
      direction: query.direction,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.webhooksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateWebhookDto: UpdateWebhookDto) {
    return this.webhooksService.update(id, updateWebhookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.webhooksService.remove(id);
  }
}
