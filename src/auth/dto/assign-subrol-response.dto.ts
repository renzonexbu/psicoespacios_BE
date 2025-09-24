export class AssignSubrolResponseDto {
  success: boolean;
  message: string;
  user: {
    id: string;
    email: string;
    nombre: string;
    apellido: string;
    role: string;
    estado: string;
    subrol: string;
  };
}



