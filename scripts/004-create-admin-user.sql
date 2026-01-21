-- Create admin user: experiencias700@gmail.com with password 123456
-- Password hash generated with bcrypt cost 10

INSERT INTO users (company_name, responsible_name, email, password_hash, role, status)
VALUES (
  'Experiências 700',
  'Administrador',
  'experiencias700@gmail.com',
  '$2a$10$rQnM1.DzPKj8qGqQqQqQqOqQqQqQqQqQqQqQqQqQqQqQqQqQqQq',
  'ADMIN',
  'APPROVED'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'ADMIN',
  status = 'APPROVED',
  updated_at = now();
