import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RootExchangesService } from './root-exchanges.service';
import { CreateRootExchangeDto } from './dto/create-root-exchange.dto';
import { UpdateRootExchangeDto } from './dto/update-root-exchange.dto';

@Controller('root-exchanges')
export class RootExchangesController {
  constructor(private readonly rootExchangesService: RootExchangesService) {}

  @Post()
  create(@Body() createRootExchangeDto: CreateRootExchangeDto) {
    return this.rootExchangesService.create(createRootExchangeDto);
  }

  @Get()
  findAll() {
    return this.rootExchangesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rootExchangesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRootExchangeDto: UpdateRootExchangeDto) {
    return this.rootExchangesService.update(id, updateRootExchangeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rootExchangesService.remove(id);
  }
}

