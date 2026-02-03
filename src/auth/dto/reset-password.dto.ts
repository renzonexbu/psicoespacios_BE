import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @IsString()
  @MinLength(6)
  newPassword: string;

  @IsString()
  @IsNotEmpty({ message: 'recaptchaToken es obligatorio' })
  recaptchaToken: string;
}
