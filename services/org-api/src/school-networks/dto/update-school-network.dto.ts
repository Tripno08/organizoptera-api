import { PartialType } from '@nestjs/swagger';
import { CreateSchoolNetworkDto } from './create-school-network.dto';

export class UpdateSchoolNetworkDto extends PartialType(CreateSchoolNetworkDto) {}
