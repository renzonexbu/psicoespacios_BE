-- Script para insertar datos en la tabla sedes
DELETE FROM sedes;

INSERT INTO sedes 
(nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado, "createdAt", "updatedAt") 
VALUES 
('PsicoEspacios Providencia', 'Av. Providencia 1234, Providencia', 'Santiago', 'Providencia', 
'+56912345678', 'providencia@psicoespacios.com', 
'{"lat": -33.4289, "lng": -70.6093}', 'ACTIVA', NOW(), NOW());

INSERT INTO sedes 
(nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado, "createdAt", "updatedAt") 
VALUES 
('PsicoEspacios Las Condes', 'Av. Apoquindo 4500, Las Condes', 'Santiago', 'Las Condes', 
'+56923456789', 'lascondes@psicoespacios.com', 
'{"lat": -33.4103, "lng": -70.5831}', 'ACTIVA', NOW(), NOW());

INSERT INTO sedes 
(nombre, direccion, ciudad, comuna, telefono, email, coordenadas, estado, "createdAt", "updatedAt") 
VALUES 
('PsicoEspacios Ñuñoa', 'Av. Irarrázaval 3400, Ñuñoa', 'Santiago', 'Ñuñoa', 
'+56934567890', 'nunoa@psicoespacios.com', 
'{"lat": -33.4563, "lng": -70.5934}', 'ACTIVA', NOW(), NOW());
