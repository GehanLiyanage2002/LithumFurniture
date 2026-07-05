import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { WorkshopStockService } from './workshop-stock.service';
import { CreateWorkshopStockDto } from './dto/create-workshop-stock.dto';
import { UpdateWorkshopStockDto } from './dto/update-workshop-stock.dto';
import { TransferWorkshopStockDto } from './dto/transfer-workshop-stock.dto';

@Controller('workshop-stock')
export class WorkshopStockController {
  constructor(private readonly workshopStockService: WorkshopStockService) {}

  @Get()
  findAll() {
    return this.workshopStockService.findAll();
  }

  @Post()
  create(@Body() createDto: CreateWorkshopStockDto) {
    return this.workshopStockService.create(createDto);
  }

  @Get('history/summary')
  getHistorySummary() {
    return this.workshopStockService.getHistorySummary();
  }

  @Get('history')
  getHistory() {
    return this.workshopStockService.getHistory();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.workshopStockService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateWorkshopStockDto) {
    return this.workshopStockService.update(id, updateDto);
  }

  @Post(':id/transfer')
  transfer(@Param('id') id: string, @Body() transferDto: TransferWorkshopStockDto) {
    return this.workshopStockService.transferToShop(id, transferDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.workshopStockService.remove(id);
  }
}
