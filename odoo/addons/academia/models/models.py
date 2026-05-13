from odoo import models, fields, api
from odoo.exceptions import ValidationError
from datetime import timedelta

class Alumno(models.Model):
    _name = 'academia.alumno'
    _description = 'Alumno'
    _rec_name = 'nombre'

    nombre = fields.Char(string='Nombre', required=True)
    apellidos = fields.Char(string='Apellidos', required=True)
    email = fields.Char(string='Email')
    edad = fields.Integer(string='Edad')
    fecha_nacimiento = fields.Date(string='Fecha de nacimiento')
    telefono = fields.Char(string='Teléfono')
    cursos_ids = fields.Many2many('academia.curso', string='Cursos')
    @api.constrains('fecha_nacimiento', 'telefono', 'edad', 'email')
    def _check_business_rules(self):
        for record in self:
            # Regla: Longitud máxima sobre Email
            if record.email is not False:
                if len(record.email) > 100:
                    raise ValidationError('¡Error! Email no puede superar los 100 caracteres')
            # Regla: Valor mínimo sobre Edad
            if record.edad is not False:
                if record.edad < 0:
                    raise ValidationError('¡Error! Edad no puede ser menor que 0')
            # Regla: Valor máximo sobre Edad
            if record.edad is not False:
                if record.edad > 120:
                    raise ValidationError('¡Error! Edad no puede ser mayor que 120')
            # Regla: No permitir fechas futuras sobre Fecha de nacimiento
            if record.fecha_nacimiento is not False:
                if record.fecha_nacimiento > fields.Date.today():
                    raise ValidationError('¡Error! Fecha de nacimiento no puede ser una fecha futura')
            # Regla: Longitud mínima sobre Teléfono
            if record.telefono is not False:
                if len(record.telefono) < 9:
                    raise ValidationError('¡Error! Teléfono debe tener al menos 9 caracteres')
            # Regla: Longitud máxima sobre Teléfono
            if record.telefono is not False:
                if len(record.telefono) > 15:
                    raise ValidationError('¡Error! Teléfono no puede superar los 15 caracteres')


class Curso(models.Model):
    _name = 'academia.curso'
    _description = 'Curso'
    _rec_name = 'titulo'

    titulo = fields.Char(string='Título', required=True)
    descripcion = fields.Text(string='Descripción')
    horas = fields.Integer(string='Horas')
    estado = fields.Selection([
        ('activo', 'Activo'),
        ('finalizado', 'Finalizado'),
        ('cancelado', 'Cancelado'),
    ], string='Estado', default='activo')
    alumnos_ids = fields.Many2many('academia.alumno', string='Alumnos')
    profesor_id = fields.Many2one('academia.profesor', string='Profesor')
    @api.constrains('horas')
    def _check_business_rules(self):
        for record in self:
            # Regla: Valor mínimo sobre Horas
            if record.horas is not False:
                if record.horas < 1:
                    raise ValidationError('¡Error! Horas no puede ser menor que 1')


class Profesor(models.Model):
    _name = 'academia.profesor'
    _description = 'Profesor'
    _rec_name = 'nombre'

    nombre = fields.Char(string='Nombre', required=True)
    apellidos = fields.Char(string='Apellidos', required=True)
    email = fields.Char(string='Email')
    especialidad = fields.Selection([
        ('matematicas', 'Matemáticas'),
        ('lengua', 'Lengua'),
        ('ciencias', 'Ciencias'),
        ('historia', 'Historia'),
        ('informatica', 'Informática'),
    ], string='Especialidad')
    cursos_ids = fields.One2many('academia.curso', 'profesor_id', string='Cursos')
    @api.constrains('email')
    def _check_business_rules(self):
        for record in self:
            # Regla: Longitud máxima sobre Email
            if record.email is not False:
                if len(record.email) > 100:
                    raise ValidationError('¡Error! Email no puede superar los 100 caracteres')


