import { BadRequestException, Body, Controller, Get, HttpStatus, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ExceptionConstants } from '@app/core/exceptions/constants';
import { CurrentAdmin, IAuthAdmin } from '@app/core/decorators/auth.decorators';
import { AdminService } from './admin.service';
import { AdminAuthGuard } from '../auth/guard/admin.guard';
import { EventDto } from './dto/event.dto';
import { FileInterceptor } from '@nestjs/platform-express/multer';
import {diskStorage} from 'multer';
import {v4 as uuidv4} from 'uuid';
import { CloudinaryService } from '@app/shared/upload/cloudinary.service';

@ApiTags('Admin')
@Controller({ version: '1' })
export class AdminController {
  constructor(private readonly adminService: AdminService,
    private readonly cloudinaryService: CloudinaryService
  ) {}

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  async getMe(@CurrentAdmin() admin: IAuthAdmin) {
    try {
      const adminMe = await this.adminService.getMe(admin.id);
      return {
        _data: adminMe,
        _metadata: {
          message: 'Admin successfully me fetched.',
          statusCode: HttpStatus.OK,
        },
      };
    } catch (err) {
      throw new BadRequestException({
        message: err.message,
        cause: new Error(err),
        code: ExceptionConstants.BadRequestCodes.UNEXPECTED_ERROR,
        description: 'Failed to fetch me',
      });
    }
  }

  @Get('user-inquries')
  @ApiBearerAuth()
  // @UseGuards(AdminAuthGuard)
  @ApiOperation({ description: 'Create New Event' })
  async getAllUserInquries() {
    try {
      const userInquries = await this.adminService.getAllUserInquries();
      return {
        _data: userInquries,
        _metadata: {
          message: 'User inquries successfully fetched.',
          statusCode: HttpStatus.OK,
        },
      };
    } catch (err) {
      throw new BadRequestException({
        message: err.message,
        cause: new Error(err),
        code: ExceptionConstants.BadRequestCodes.UNEXPECTED_ERROR,
        description: 'Failed to fetch user inquries.',
      });
    }
  }

  @Post('event')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ description: 'Create event' })
  @ApiBody({ type: EventDto })
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, cb) => {
          return cb(null, `${uuidv4()}.${file.originalname}`);
        },
      }),
    }),
  )
  async createEvent(@Body() dto: EventDto, @UploadedFile() file: Express.Multer.File, @CurrentAdmin() admin: IAuthAdmin) {
    try {
      let path = undefined;
      if(file){
        path = await this.cloudinaryService.uploadImage(file.path, 'event')
      }
      const newEvent = await this.adminService.createEvent(dto, admin.id, path || undefined);
      return {
        _data: newEvent,
        _metadata: {
          message: 'Event saved successfully.',
          statusCode: HttpStatus.CREATED,
        },
      };
    } catch (err) {
      throw new BadRequestException({
        message: err.message,
        cause: new Error(err),
        code: ExceptionConstants.BadRequestCodes.UNEXPECTED_ERROR,
        description: 'Failed to save new event.',
      });
    }
  }
}
