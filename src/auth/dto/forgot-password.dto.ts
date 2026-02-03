import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'recaptchaToken es obligatorio' })
  recaptchaToken: string;
}
