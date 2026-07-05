import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { SuppliersService } from './suppliers.service';

@Controller('suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  create(@Body() data: any) {
    return this.suppliersService.create(data);
  }

  @Get()
  findAll() {
    return this.suppliersService.findAll();
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.suppliersService.remove(id);
  }
}
