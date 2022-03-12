import { IsString, Length } from "class-validator";

export class CreateProductDto {
  @IsString()
  @Length(4)
  name!: string;

  @IsString()
  description!: string;

  @IsString()
  type!: string;
}
