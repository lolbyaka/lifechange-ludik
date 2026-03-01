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
import { BotsService } from './bots.service';
import { CreateTradeBotDto } from './dto/create-trade-bot.dto';
import { UpdateTradeBotDto } from './dto/update-trade-bot.dto';

@Controller('bots')
export class BotsController {
  constructor(private readonly botsService: BotsService) {}

  @Post()
  create(@Body() createTradeBotDto: CreateTradeBotDto) {
    return this.botsService.create(createTradeBotDto);
  }

  @Get()
  findAll(@Query('exchangeId') exchangeId?: string) {
    return this.botsService.findAll(exchangeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.botsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTradeBotDto: UpdateTradeBotDto) {
    return this.botsService.update(id, updateTradeBotDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.botsService.remove(id);
  }
}
